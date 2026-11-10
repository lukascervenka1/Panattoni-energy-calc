import type { NextRequest } from "next/server";
import { readPenb } from "@/lib/penbReader";
import { storePenb } from "@/lib/penbStore";
import {
  MAX_PENB_BYTES,
  PENB_CONSENT_VERSION,
  createRateLimiter,
  isSameOrigin,
  looksLikePdf,
  toPenbValues,
  type PenbUploadError,
  type PenbUploadResponse,
} from "@/lib/penbUpload";

export const maxDuration = 30;

// 10 uploads per 10 minutes per client is plenty for a person comparing a
// couple of buildings; anything above that is a script.
const allow = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

function reply(body: PenbUploadResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function fail(error: PenbUploadError, status: number) {
  return reply({ ok: false, error }, status);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.url)) return fail("forbidden", 403);

  const client =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!allow(client)) return fail("rate_limited", 429);

  // Refuse oversized bodies before buffering them. The multipart envelope
  // adds a little on top of the file itself.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_PENB_BYTES + 64 * 1024) return fail("too_large", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("missing_file", 400);
  }

  if (form.get("consent") !== PENB_CONSENT_VERSION) return fail("consent_required", 400);
  const locale = form.get("locale") === "en" ? "en" : "cs";

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("missing_file", 400);
  if (file.size > MAX_PENB_BYTES) return fail("too_large", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(bytes)) return fail("not_pdf", 415);

  const read = await readPenb(bytes);
  if (!read.ok) {
    switch (read.failure) {
      case "too_many_pages":
      case "too_much_text":
        return fail("not_penb", 422);
      case "unreadable":
        return fail("unreadable", 422);
      case "timeout":
      case "too_much_memory":
        // Never seen with a real certificate — worth knowing when it happens.
        console.warn(`[penb] reading stopped: ${read.failure} (${bytes.byteLength} bytes)`);
        return fail("unreadable", 422);
      case "crashed":
        console.error("[penb] reader crashed", read.detail);
        return fail("server", 500);
    }
  }

  const parsed = read.result;
  const record = { locale, consentVersion: PENB_CONSENT_VERSION } as const;

  if (!parsed.ok) {
    // A real certificate we just couldn't read the table of is still worth
    // keeping for the dataset. Scans and non-PENB PDFs are not: we can't
    // tell what they are, so we don't hold on to them.
    if (parsed.error === "no_values") {
      await storePenb(bytes, { ...record, extraction: null, parseError: parsed.error });
    }
    return fail(parsed.error, 422);
  }

  const { extraction } = parsed;
  await storePenb(bytes, { ...record, extraction, parseError: null });

  // parsePenb only succeeds with an area, but the type doesn't know that.
  if (extraction.areaM2 === null) return fail("no_values", 422);
  const { values, warnings } = toPenbValues({ ...extraction, areaM2: extraction.areaM2 });
  return reply({ ok: true, values, warnings });
}
