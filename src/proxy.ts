import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

/**
 * Generates a fresh per-request nonce and puts it in the CSP so the page's
 * own inline scripts (React/Next's hydration payload) can run without
 * `'unsafe-inline'` in script-src. Next.js reads the nonce back out of this
 * header and stamps it onto its own inline scripts automatically — see
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
 *
 * This requires the page to render dynamically (see `connection()` in
 * app/page.tsx): a nonce baked into a statically-generated HTML file would
 * be reused by every visitor, which defeats the point of a nonce.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
