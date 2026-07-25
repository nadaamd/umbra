"use client";

import { useBreaker } from "@/lib/store";
import { armThreshold } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";
import { usdCompact, bps, hhmm, addr } from "@/lib/format";
import { CheckCircle2, ArrowRight } from "lucide-react";

function LogLine({
  ts,
  tone = "ink3",
  children,
}: {
  ts: number;
  tone?: "ink3" | "ink2" | "armed" | "risk" | "safe";
  children: React.ReactNode;
}) {
  const toneClass = {
    ink3: "text-ink3",
    ink2: "text-ink2",
    armed: "text-armed",
    risk: "text-risk",
    safe: "text-safe",
  }[tone];
  return (
    <div className="flex gap-2 font-mono text-[10px] leading-relaxed">
      <span className="text-ink4 tabular-nums shrink-0">{hhmm(ts)}</span>
      <span className={toneClass}>{children}</span>
    </div>
  );
}

export function ExecutionPanel() {
  const { status, current, summary, execution, triggered } = useBreaker();
  const tau = summary?.tauStar ?? 66;
  const arm = armThreshold(tau);
  const cbri = current?.cbri ?? 0;
  const ts = current?.t ?? 0;

  const totalOut = execution.reduce((s, l) => s + l.amountUsd, 0);

  return (
    <div className="flex flex-col h-full">
      {/* status header */}
      <div className="flex items-center justify-between p-3 border-b border-line">
        <StatusBadge status={status} size="lg" />
        <div className="text-right">
          <div className="label">Position</div>
          <div className="font-mono text-sm tabular-nums text-ink">
            {usdCompact(summary?.position ?? 0)} {summary?.safeAsset ? "USDC" : ""}
          </div>
        </div>
      </div>

      {/* narrative line */}
      <div className="px-3 py-2 border-b border-line font-mono text-[11px] text-ink2">
        {status === "SAFE" && (
          <>Breaker armed & monitoring. CBRI {cbri.toFixed(0)} — well below trip τ* {tau}.</>
        )}
        {status === "ARMED" && (
          <span className="text-armed">
            ⚠ Risk building. CBRI {cbri.toFixed(0)} crossed arm {arm} — staging evacuation route.
          </span>
        )}
        {status === "TRIGGERED" && (
          <span className="text-risk">
            ⚡ TRIP. CBRI {cbri.toFixed(0)} ≥ τ* {tau} — emergency evacuation to {summary?.safeAsset} executed.
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!triggered ? (
          /* standby log */
          <div className="p-3 space-y-1">
            <LogLine ts={ts}>subgraph sync · Uniswap v3 · {summary?.pool}</LogLine>
            <LogLine ts={ts}>CBRI = {cbri.toFixed(1)} · arm={arm} · trip τ*={tau}</LogLine>
            <LogLine ts={ts} tone="ink2">
              drain {(current?.drain ?? 0).toFixed(1)}%/h · depeg {(Math.abs(1 - (current?.usdc ?? 1)) * 1e4).toFixed(0)}bps
            </LogLine>
            {status === "ARMED" && (
              <>
                <LogLine ts={ts} tone="armed">route staged: {summary?.safeAsset} best-exec via Uniswap</LogLine>
                <LogLine ts={ts} tone="armed">awaiting τ* confirmation…</LogLine>
              </>
            )}
            <LogLine ts={ts} tone="ink3">no action · funds retained in position</LogLine>
          </div>
        ) : (
          /* execution log */
          <div className="flex flex-col">
            {/* summary strip */}
            <div className="grid grid-cols-3 gap-px bg-line border-b border-line">
              <div className="bg-panel px-2.5 py-2">
                <div className="label">Evacuated</div>
                <div className="font-mono text-[13px] text-ink tabular-nums mt-1">
                  {usdCompact(totalOut)}
                </div>
              </div>
              <div className="bg-panel px-2.5 py-2">
                <div className="label">Funds saved</div>
                <div className="font-mono text-[13px] text-safe tabular-nums mt-1">
                  {usdCompact(summary?.fundsSaved ?? 0)}
                </div>
              </div>
              <div className="bg-panel px-2.5 py-2">
                <div className="label">Success fee</div>
                <div className="font-mono text-[13px] text-ink tabular-nums mt-1">
                  {usdCompact(summary?.successFee ?? 0)}
                </div>
              </div>
            </div>

            {/* legs */}
            <div className="p-3 space-y-1.5">
              <LogLine ts={execution[0]?.ts ?? ts} tone="risk">
                ⚡ TRIP @ CBRI {tau} — Uniswap best-execution split · $1M USDC → {summary?.safeAsset}
              </LogLine>
              {execution.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between border border-line rounded-sm px-2.5 py-1.5 bg-panel2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={12} className="text-safe shrink-0" />
                    <span className="font-mono text-[10px] text-ink2 w-24 truncate">
                      {l.venue}
                    </span>
                    <span className="font-mono text-[10px] text-ink3 flex items-center gap-1">
                      {l.fromToken} <ArrowRight size={9} /> {l.toToken}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tabular-nums text-ink">
                      {usdCompact(l.amountUsd)}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-ink3 w-14 text-right">
                      {bps(l.priceImpactBps)}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wide text-safe border border-safe/30 rounded-sm px-1">
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
              <LogLine ts={execution[execution.length - 1]?.ts ?? ts} tone="safe">
                ✓ evacuation complete · exit @ {summary?.exitPrice.toFixed(4)} · avg slip {summary?.exitSlipBps.toFixed(0)}bps
              </LogLine>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
