import "server-only";
import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import type { PenbExtraction, PenbParseError } from "./penb";

export interface StoredPenbRecord {
  uploadedAt: string;
  sha256: string;
  sizeBytes: number;
  locale: "cs" | "en";
  /** Which consent wording the visitor agreed to — see PENB_CONSENT_VERSION. */
  consentVersion: string;
  extraction: PenbExtraction | null;
  parseError: PenbParseError | null;
}

/**
 * Keeps the uploaded certificate plus what we read from it, so the dataset
 * can be built later without re-parsing. Both objects are private: there is
 * no public URL, and reading them back needs the store's token.
 *
 * Files are keyed by content hash, so the same PDF uploaded twice overwrites
 * itself rather than piling up duplicates. Deliberately not stored: the
 * visitor's IP, the original file name, anything about the browser.
 *
 * Returns false (and logs) instead of throwing — the visitor still gets
 * their calculation if storage is down or not configured.
 */
export async function storePenb(
  bytes: Uint8Array,
  record: Omit<StoredPenbRecord, "sha256" | "sizeBytes" | "uploadedAt">,
): Promise<boolean> {
  // A store connected in the Vercel dashboard now provides BLOB_STORE_ID and
  // authenticates with the deployment's OIDC token; older stores (and local
  // `vercel env pull`) use a read-write token. @vercel/blob handles both.
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[penb] no Blob store configured (BLOB_STORE_ID) — certificate not stored");
    return false;
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const full: StoredPenbRecord = {
    ...record,
    sha256,
    sizeBytes: bytes.byteLength,
    uploadedAt: new Date().toISOString(),
  };
  const options = { access: "private", addRandomSuffix: false, allowOverwrite: true } as const;

  try {
    await Promise.all([
      put(`penb/${sha256}.pdf`, Buffer.from(bytes), { ...options, contentType: "application/pdf" }),
      put(`penb/${sha256}.json`, JSON.stringify(full, null, 2), {
        ...options,
        contentType: "application/json",
      }),
    ]);
    return true;
  } catch (err) {
    console.error("[penb] failed to store certificate", sha256, err);
    return false;
  }
}
