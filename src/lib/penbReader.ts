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
 * every request it's serving. Real certificates use under 200 MB; the Hobby
 * plan gives a function 1 GB in total.
 */
const MAX_WORKER_MEMORY_BYTES = 384 * 1024 * 1024;
const MEMORY_CHECK_MS = 25;

/**
 * Node ≥ 22.16 (Vercel runs 24) can report a worker's own heap, including the
 * ArrayBuffers pdf.js decodes into, even mid-loop. @types/node 20 doesn't
 * know the method yet.
 */
type MeasurableWorker = Worker & {
  getHeapStatistics?: () => Promise<{ used_heap_size: number; external_memory?: number }>;
};

export type PenbReadFailure = PdfExtractionCode | "timeout" | "too_much_memory" | "crashed";

export type PenbReadOutcome =
  | { ok: true; result: PenbParseResult }
  | { ok: false; failure: PenbReadFailure; detail?: string };

/**
 * Reads a certificate in a worker thread that is terminated outright on a
 * timeout or when its memory runs away. pdf.js decodes a stream in one
 * synchronous go, so on the request's own thread neither check could ever
 * fire — and a crafted file would stall or crash everything else the
 * instance is serving. Never rejects.
 */
export function readPenb(bytes: Uint8Array): Promise<PenbReadOutcome> {
  return new Promise((resolve) => {
    const worker: MeasurableWorker = new Worker(new URL("./penbWorker.ts", import.meta.url), {
      // Caps the JS heap; the decoded-stream buffers live outside it, which
      // is what the watchdog below is for.
      resourceLimits: { maxOldGenerationSizeMb: 256 },
    });

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

    // Measures this worker alone, so a hostile upload never cuts short a
    // visitor's certificate being read alongside it. Where the runtime can't
    // measure a worker, the whole process's growth stands in for it.
    const baseline = process.memoryUsage.rss();
    let measuring = false;
    const watchdog = setInterval(async () => {
      if (measuring) return;
      measuring = true;
      try {
        const used = worker.getHeapStatistics
          ? await worker.getHeapStatistics().then((s) => s.used_heap_size + (s.external_memory ?? 0))
          : process.memoryUsage.rss() - baseline;
        if (used > MAX_WORKER_MEMORY_BYTES) finish({ ok: false, failure: "too_much_memory" });
      } catch {
        // The worker finished or was terminated between ticks.
      } finally {
        measuring = false;
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
