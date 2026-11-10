"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { formatForLocale } from "@/lib/numberInput";
import {
  MAX_PENB_BYTES,
  PENB_CONSENT_VERSION,
  type PenbUploadError,
  type PenbUploadResponse,
  type PenbValues,
  type PenbWarning,
} from "@/lib/penbUpload";
import { AlertIcon, CheckCircleIcon, DocumentUploadIcon } from "./icons";

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success"; values: PenbValues; warnings: PenbWarning[] }
  | { kind: "error"; error: PenbUploadError | "network" };

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function PenbUpload({
  active,
  onLoaded,
}: {
  /**
   * False once the visitor has switched to a PENB class instead — the
   * success summary would then describe values that are no longer in the
   * fields, so the drop zone comes back.
   */
  active: boolean;
  onLoaded: (values: PenbValues) => void;
}) {
  const { t, locale } = useLocale();
  const inputId = useId();
  const consentId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [consent, setConsent] = useState(false);
  const [dragging, setDragging] = useState(false);
  // A file picked before the consent box was ticked waits here, and uploads
  // the moment consent is given — no need to pick it again.
  const [pending, setPending] = useState<File | null>(null);

  // A PDF dropped just outside the zone would otherwise make the browser
  // navigate away to display it, wiping the visitor's inputs.
  useEffect(() => {
    const swallow = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, []);

  async function upload(file: File) {
    setPending(null);
    setStatus({ kind: "uploading" });

    const body = new FormData();
    body.append("file", file);
    body.append("consent", PENB_CONSENT_VERSION);
    body.append("locale", locale);

    let data: PenbUploadResponse;
    try {
      const res = await fetch("/api/penb", { method: "POST", body });
      // The Vercel Firewall answers a rate-limited request itself, with its
      // own non-JSON page — so the status has to be read before the body.
      if (res.status === 429) {
        setStatus({ kind: "error", error: "rate_limited" });
        return;
      }
      data = (await res.json()) as PenbUploadResponse;
    } catch {
      setStatus({ kind: "error", error: "network" });
      return;
    }

    if (!data.ok) {
      setStatus({ kind: "error", error: data.error });
      return;
    }
    onLoaded(data.values);
    setStatus({ kind: "success", values: data.values, warnings: data.warnings });
  }

  function handleFile(file: File | undefined) {
    if (!file || status.kind === "uploading") return;
    if (!isPdfFile(file)) return setStatus({ kind: "error", error: "not_pdf" });
    if (file.size > MAX_PENB_BYTES) return setStatus({ kind: "error", error: "too_large" });

    if (!consent) {
      setPending(file);
      setStatus({ kind: "error", error: "consent_required" });
      return;
    }
    void upload(file);
  }

  function handleConsent(checked: boolean) {
    setConsent(checked);
    if (checked && pending) void upload(pending);
  }

  function reset() {
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  const mwh = (n: number) => formatForLocale(n, locale, 1);

  if (active && status.kind === "success") {
    const { values, warnings } = status;
    const unverified = warnings.includes("unverified");

    return (
      <div
        role="status"
        className="rounded-lg border p-4 sm:p-5"
        // Green says "done, nothing to do". When the figures didn't reconcile
        // that would be a false all-clear, so the panel stays neutral then.
        style={
          unverified
            ? { borderColor: "var(--color-border-default)", background: "var(--color-bg)" }
            : { borderColor: "#bfe5cc", background: "#f1faf4" }
        }
      >
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#16a34a]" />
          <p className="text-sm font-medium">{t.penb.successTitle}</p>
        </div>

        {/* Full panel width (not indented behind the icon) and centred, so
            the middle column lines up with the centred button below. */}
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-center text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {t.penb.area}
            </dt>
            <dd className="font-medium">{formatForLocale(values.areaM2, locale, 0)} m²</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {t.penb.ele}
            </dt>
            <dd className="font-medium">
              {mwh(values.eleMwh)} {t.sliders.mwhUnit}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {t.penb.gas}
            </dt>
            <dd className="font-medium">
              {mwh(values.gasMwh)} {t.sliders.mwhUnit}
            </dd>
          </div>
        </dl>

        {/* Only the "check these" warning is shown — ambient heat and
            other fuels are handled silently (business decision: show
            the PENB consumption, nothing else). This one stays because
            it means we may have misread the certificate. */}
        {unverified && (
          <p className="mt-4 flex items-start justify-center gap-2 text-center text-[12px] leading-relaxed text-[#b42318]">
            <AlertIcon className="mt-px h-4 w-4 flex-shrink-0" />
            {t.penb.unverified}
          </p>
        )}

        <div className="mt-4 flex justify-center">
          {/* The visible pill is 85 % of the standard button; the button
              itself keeps a 44 px tap target around it (same pattern as
              LanguageToggle). */}
          <button
            type="button"
            onClick={reset}
            className="group flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            <span
              className="flex h-[37px] items-center rounded-full border bg-white px-[17px] text-[12px] font-semibold text-[var(--color-accent)] transition-transform duration-150 group-hover:scale-[1.03]"
              style={{ borderColor: unverified ? "var(--color-border-default)" : "#bfe5cc" }}
            >
              {t.penb.replace}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const uploading = status.kind === "uploading";
  const error = status.kind === "error" ? status.error : null;
  const consentMissing = error === "consent_required";

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        aria-busy={uploading}
        className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-6 text-center transition-colors duration-150 sm:py-7"
        style={{
          borderColor: dragging ? "var(--color-accent)" : "var(--color-border-default)",
          background: dragging ? "var(--color-accent-soft)" : "var(--color-bg)",
        }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-navy)" }}
        >
          {uploading ? (
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            />
          ) : (
            <DocumentUploadIcon className="h-6 w-6" />
          )}
        </span>

        <div>
          <p className="text-sm font-medium">
            {uploading ? t.penb.reading : dragging ? t.penb.dropTitleActive : t.penb.dropTitle}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {t.penb.dropHint}
          </p>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          aria-disabled={uploading}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-5 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.03] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)] aria-disabled:cursor-wait aria-disabled:opacity-60 aria-disabled:hover:scale-100"
          style={{ background: "var(--color-navy)" }}
        >
          {t.penb.choose}
        </label>
      </div>

      <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3 py-1">
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(e) => handleConsent(e.target.checked)}
          aria-invalid={consentMissing}
          aria-describedby={consentMissing ? `${consentId}-error` : undefined}
          className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 cursor-pointer accent-[var(--color-navy)]"
        />
        <span className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {t.penb.consent}
        </span>
      </label>

      <div aria-live="polite">
        {error && (
          <p
            id={consentMissing ? `${consentId}-error` : undefined}
            className="flex items-start gap-2 text-[12px] leading-relaxed text-[#b42318]"
          >
            <AlertIcon className="mt-px h-4 w-4 flex-shrink-0" />
            {consentMissing ? t.penb.consentNeeded : t.penb.errors[error]}
          </p>
        )}
      </div>
    </div>
  );
}
