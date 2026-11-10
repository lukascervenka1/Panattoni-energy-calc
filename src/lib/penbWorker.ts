/**
 * Worker-thread entry for reading one uploaded certificate — started and
 * supervised by penbReader.ts, which kills it if the file makes pdf.js or the
 * parser run away. Receives the PDF bytes as its only message and answers
 * with exactly one reply.
 */
import { parentPort } from "node:worker_threads";
import { parsePenb, type PenbParseResult } from "./penb";
import { extractPdfPages, PdfExtractionError, type PdfExtractionCode } from "./penbPdf";

export type PenbWorkerReply =
  | { kind: "parsed"; result: PenbParseResult }
  | { kind: "failed"; code: PdfExtractionCode }
  | { kind: "crashed"; message: string };

parentPort!.once("message", async (bytes: Uint8Array) => {
  let reply: PenbWorkerReply;
  try {
    reply = { kind: "parsed", result: parsePenb(await extractPdfPages(bytes)) };
  } catch (err) {
    reply =
      err instanceof PdfExtractionError
        ? { kind: "failed", code: err.code }
        : { kind: "crashed", message: String(err) };
  }
  parentPort!.postMessage(reply);
});
