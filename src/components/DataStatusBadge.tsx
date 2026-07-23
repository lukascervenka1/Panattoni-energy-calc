import type { DataSourceStatus } from "@/lib/types";

export function DataStatusBadge({ status }: { status: DataSourceStatus }) {
  const isLive = status.source === "sheets";
  const time = new Date(status.fetchedAt).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}
    >
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ background: isLive ? "#22c55e" : "#f59e0b" }}
      />
      <span>
        {isLive ? "Data: Google Sheets" : "Data: vestavěná záloha"} · aktualizováno {time} ·{" "}
        {status.buildingCount} záznamů
      </span>
    </div>
  );
}
