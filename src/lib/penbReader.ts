import "server-only";
import { Worker } from "node:worker_threads";
import type { PenbParseResult } from "./penb";
import type { PdfExtractionCode } from "./penbPdf";
import type { PenbWorkerReply } from "./penbWorker";

/** Real certificates read in under a second; the 110-page one in 0.8 s. */
const READ_TIMEOUT_MS = 15_000;
/**
 * pdf.js keeps every decoded stream in memory, so ~1 MB of compressed
 * whitespace inflates to gigabytes — enough to take down the function and
 * every request it's serving. Real certificates add under 200 MB.
 */
const MAX_MEMORY_GROWTH_BYTES = 768 * 1024 * 1024;
const MEMORY_CHECK_MS = 25;

export type PenbReadFailure = PdfExtractionCode | "timeout" | "too_much_memory" | "crashed";

export type PenbReadOutcome =
  | { ok: true; result: PenbParseResult }
  | { ok: false; failure: PenbReadFailure; detail?: string };

/**
 * Reads a certificate in a worker thread that is terminated outright on a
 * timeout or when memory runs away. pdf.js decodes a stream in one
 * synchronous go, so on the request's own thread neither check could ever
 * fire — and a crafted file would stall or crash everything else the
 * instance is serving. Never rejects.
 */
export function readPenb(bytes: Uint8Array): Promise<PenbReadOutcome> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./penbWorker.ts", import.meta.url), {
      // Caps the JS heap; the decoded-stream buffers live outside it, which
      // is what the RSS watchdog below is for.
      resourceLimits: { maxOldGenerationSizeMb: 512 },
    });
    const baseline = process.memoryUsage.rss();

    let settled = false;
    const finish = (outcome: PenbReadOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(watchdog);
      void worker.terminate();
      resolve(outcome);
    };

    const timer = setTimeout(() => finish({ ok: false, failure: "timeout" }), READ_TIMEOUT_MS);
    const watchdog = setInterval(() => {
      if (process.memoryUsage.rss() - baseline > MAX_MEMORY_GROWTH_BYTES) {
        finish({ ok: false, failure: "too_much_memory" });
      }
    }, MEMORY_CHECK_MS);

    worker.once("message", (reply: PenbWorkerReply) => {
      if (reply.kind === "parsed") finish({ ok: true, result: reply.result });
      else if (reply.kind === "failed") finish({ ok: false, failure: reply.code });
      else finish({ ok: false, failure: "crashed", detail: reply.message });
    });
    worker.once("error", (err: Error & { code?: string }) => {
      finish(
        err.code === "ERR_WORKER_OUT_OF_MEMORY"
          ? { ok: false, failure: "too_much_memory" }
          : { ok: false, failure: "crashed", detail: String(err) },
      );
    });
    worker.once("exit", () => finish({ ok: false, failure: "crashed", detail: "worker exited" }));

    // Copied, not transferred: the route still needs the bytes to store them.
    worker.postMessage(bytes);
  });
}
