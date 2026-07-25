"use client";

import { useBreaker } from "@/lib/store";
import { armThreshold } from "@/lib/data";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const SEGMENTS = 56;

export function RiskGauge() {
  const { current, visible, status, summary } = useBreaker();
  const cbri = current?.cbri ?? 0;
  const tau = summary?.tauStar ?? 66;
  const arm = armThreshold(tau);

  // trend over the last ~30 min (6 candles)
  const prev = visible[visible.length - 7]?.cbri ?? cbri;
  const delta = cbri - prev;

  const zoneColor = (v: number) =>
    v >= tau ? "#e5484d" : v >= arm ? "#f5a623" : "#30a46c";
  const statusInk =
    status === "TRIGGERED"
      ? "text-risk"
      : status === "ARMED"
      ? "text-armed"
      : "text-safe";

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="label">CBRI · Circuit Breaker Risk Index</div>
          <div className="font-mono text-[10px] text-ink3 mt-0.5">
            Noisy-OR · drain ∨ imbalance ∨ depeg
          </div>
        </div>
        <div
          className={`flex items-center gap-1 font-mono text-xs tabular-nums ${
            delta > 0.5 ? "text-risk" : delta < -0.5 ? "text-safe" : "text-ink3"
          }`}
        >
          {delta > 0.5 ? (
            <ArrowUpRight size={13} />
          ) : delta < -0.5 ? (
            <ArrowDownRight size={13} />
          ) : (
            <Minus size={13} />
          )}
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}
          <span className="text-ink4">/30m</span>
        </div>
      </div>

      {/* Hero number */}
      <div className="flex items-end gap-3 mt-3">
        <div
          className={`font-mono tabular-nums leading-none ${statusInk}`}
          style={{ fontSize: 68, letterSpacing: "-0.03em" }}
        >
          {cbri.toFixed(1)}
        </div>
        <div className="mb-2 font-mono text-ink3 text-lg">/100</div>
      </div>

      {/* Segmented meter */}
      <div className="mt-5">
        {/* threshold markers */}
        <div className="relative h-4 mb-1">
          {[
            { v: arm, label: "ARM", c: "#f5a623" },
            { v: tau, label: "τ*", c: "#e5484d" },
          ].map((m) => (
            <div
              key={m.label}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${m.v}%` }}
            >
              <span
                className="font-mono text-[9px] tabular-nums"
                style={{ color: m.c }}
              >
                {m.label} {m.v}
              </span>
              <div className="w-px h-1.5 mt-px" style={{ background: m.c }} />
            </div>
          ))}
        </div>

        <div className="flex gap-[2px] h-9 items-end">
          {Array.from({ length: SEGMENTS }).map((_, k) => {
            const v = ((k + 0.5) / SEGMENTS) * 100;
            const lit = v <= cbri;
            const isHead = Math.abs(v - cbri) < 100 / SEGMENTS / 1.2;
            const col = zoneColor(v);
            return (
              <div
                key={k}
                className="flex-1 rounded-[1px] transition-all"
                style={{
                  height: lit ? "100%" : "62%",
                  background: lit ? col : "#20262d",
                  opacity: isHead ? 1 : lit ? 0.85 : 1,
                  boxShadow: isHead ? `0 0 0 1px ${col}` : "none",
                }}
              />
            );
          })}
        </div>

        {/* zone legend */}
        <div className="flex justify-between mt-2 font-mono text-[9px] tabular-nums text-ink3">
          <span>0</span>
          <span className="text-safe">SAFE ‹{arm}</span>
          <span className="text-armed">ARMED {arm}–{tau}</span>
          <span className="text-risk">TRIP ≥{tau}</span>
          <span>100</span>
        </div>
      </div>

      {/* sub-signal contributions */}
      <div className="grid grid-cols-3 gap-px bg-line mt-auto border border-line rounded-sm overflow-hidden">
        {[
          { k: "DRAIN ΔL/Δt", v: current?.sDrain ?? 0, w: 1.0 },
          { k: "IMBALANCE", v: current?.sOfi ?? 0, w: 0.0 },
          { k: "DEPEG", v: current?.sDepeg ?? 0, w: 1.0 },
        ].map((s) => (
          <div key={s.k} className="bg-panel px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="label">{s.k}</span>
              {s.w === 0 && (
                <span className="font-mono text-[8px] text-ink4 uppercase">
                  w=0
                </span>
              )}
            </div>
            <div className="font-mono text-sm tabular-nums text-ink mt-1">
              {(s.v * 100).toFixed(0)}
              <span className="text-ink4 text-[10px]">%</span>
            </div>
            <div className="h-[3px] bg-raised mt-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, s.v * 100)}%`,
                  background: s.w === 0 ? "#3c424a" : "#3987e5",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
