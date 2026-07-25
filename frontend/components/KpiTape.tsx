"use client";

import { useBreaker } from "@/lib/store";
import { usdCompact, price4, pct } from "@/lib/format";

function Cell({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "risk" | "safe" | "armed";
}) {
  const t = {
    ink: "text-ink",
    risk: "text-risk",
    safe: "text-safe",
    armed: "text-armed",
  }[tone];
  return (
    <div className="flex items-baseline gap-2 px-4 h-full whitespace-nowrap">
      <span className="label">{label}</span>
      <span className={`font-mono text-[13px] tabular-nums ${t}`}>{value}</span>
    </div>
  );
}

export function KpiTape() {
  const { current, summary, status } = useBreaker();
  const depegBps = Math.abs(1 - (current?.usdc ?? 1)) * 1e4;
  const savedPct = summary ? (summary.fundsSaved / summary.position) * 100 : 0;

  return (
    <div className="h-9 shrink-0 border-b border-line bg-panel flex items-center overflow-x-auto divide-x divide-line">
      <Cell
        label="CBRI"
        value={(current?.cbri ?? 0).toFixed(1)}
        tone={status === "TRIGGERED" ? "risk" : status === "ARMED" ? "armed" : "safe"}
      />
      <Cell label="USDC" value={price4(current?.usdc ?? 1)} tone={depegBps > 120 ? "risk" : "ink"} />
      <Cell label="Depeg" value={`${depegBps.toFixed(0)}bps`} />
      <Cell label="Drain" value={`${(current?.drain ?? 0).toFixed(1)}%/h`} />
      <div className="flex-1" />
      <Cell label="τ* Optimal" value={`${summary?.tauStar ?? "—"}`} tone="armed" />
      <Cell label="Exit" value={price4(summary?.exitPrice ?? 0)} tone="safe" />
      <Cell
        label="Funds Saved"
        value={`${usdCompact(summary?.fundsSaved ?? 0)} · ${pct(savedPct)}`}
        tone="safe"
      />
      <Cell label="Fee 10%" value={usdCompact(summary?.successFee ?? 0)} />
    </div>
  );
}
