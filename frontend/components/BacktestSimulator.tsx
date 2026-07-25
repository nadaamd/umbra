"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useBreaker } from "@/lib/store";
import { sweepAt } from "@/lib/data";
import { usdCompact, bps, price4, stampIso } from "@/lib/format";
import { Target, AlertTriangle } from "lucide-react";

function SweepTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-line2 bg-bg/95 px-2 py-1 rounded-sm font-mono text-[10px] tabular-nums">
      <div className="text-ink3">τ = {p.tau}</div>
      <div className={p.fp ? "text-risk" : "text-safe"}>
        {usdCompact(p.fundsSaved)} saved
      </div>
      <div className="text-ink3">{bps(p.exitSlipBps)} slip</div>
    </div>
  );
}

export function BacktestSimulator() {
  const { sweep, summary } = useBreaker();
  const tauStar = summary?.tauStar ?? 66;
  const [tau, setTau] = useState(tauStar);

  const data = useMemo(
    () =>
      sweep.map((r) => ({
        ...r,
        savedK: r.fundsSaved / 1e3,
        reliable: r.fp === 0 ? r.fundsSaved / 1e3 : null,
        risky: r.fp === 1 ? r.fundsSaved / 1e3 : null,
      })),
    [sweep]
  );

  const sel = sweepAt(sweep, tau);
  const star = sweepAt(sweep, tauStar);
  const delta = sel && star ? sel.fundsSaved - star.fundsSaved : 0;
  const isOptimal = tau >= (summary?.plateauLo ?? tauStar) && tau <= (summary?.plateauHi ?? tauStar);

  return (
    <div className="flex flex-col h-full">
      {/* chart */}
      <div className="h-[150px] shrink-0 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 6, right: 14, bottom: 2, left: 30 }}
          >
            <XAxis
              dataKey="tau"
              type="number"
              domain={[10, 99]}
              ticks={[10, 30, 50, 70, 90]}
              tickLine={false}
              axisLine={{ stroke: "#1e2329" }}
              tick={{ fontSize: 9, fill: "#626871" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={30}
              tick={{ fontSize: 9, fill: "#626871" }}
              tickFormatter={(v) => `${v}k`}
            />
            <ReferenceLine
              x={tauStar}
              stroke="#e6e8ea"
              strokeDasharray="3 2"
              strokeOpacity={0.5}
              label={{
                value: `τ* ${tauStar}`,
                position: "top",
                fill: "#e6e8ea",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
            />
            <ReferenceLine x={tau} stroke="#f5a623" strokeWidth={1} />
            <Line
              dataKey="reliable"
              stroke="#30a46c"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
              name="reliable"
            />
            <Line
              dataKey="risky"
              stroke="#e5484d"
              strokeWidth={2}
              strokeDasharray="3 2"
              dot={false}
              isAnimationActive={false}
              connectNulls
              name="false-positive"
            />
            {sel && (
              <ReferenceDot
                x={sel.tau}
                y={sel.fundsSaved / 1e3}
                r={4}
                fill="#f5a623"
                stroke="#08090a"
                strokeWidth={1.5}
              />
            )}
            <Tooltip content={<SweepTip />} cursor={{ stroke: "#3c424a" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 px-3 py-1 font-mono text-[9px] text-ink3">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[2px] bg-safe" /> reliable (0 false-positive)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-[2px] bg-risk" /> τ too low → false alarm
        </span>
      </div>

      {/* slider */}
      <div className="px-3 py-2 border-t border-line">
        <div className="flex items-center justify-between mb-2">
          <span className="label">Trigger threshold τ</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg tabular-nums text-armed leading-none">
              {tau}
            </span>
            <button
              onClick={() => setTau(tauStar)}
              className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-ink3 border border-line2 rounded-sm px-1.5 py-1 hover:text-ink2"
            >
              <Target size={10} /> reset τ*
            </button>
          </div>
        </div>
        <input
          type="range"
          className="cb-range w-full"
          min={10}
          max={99}
          value={tau}
          onChange={(e) => setTau(Number(e.target.value))}
        />
      </div>

      {/* result readout */}
      <div className="grid grid-cols-4 gap-px bg-line border-t border-line mt-auto">
        {[
          { l: "Trigger", v: sel ? stampIso(sel.triggerDt).slice(3) : "—", s: "UTC" },
          { l: "Exit price", v: sel ? price4(sel.exitPrice) : "—", s: "USDC" },
          { l: "Slippage", v: sel ? bps(sel.exitSlipBps) : "—", s: "1inch-cal" },
          {
            l: "Funds saved",
            v: sel ? usdCompact(sel.fundsSaved) : "—",
            s: "vs trough",
            tone: sel && sel.fp ? "risk" : "safe",
          },
        ].map((c) => (
          <div key={c.l} className="bg-panel px-2.5 py-2">
            <div className="label">{c.l}</div>
            <div
              className={`font-mono text-[13px] tabular-nums mt-1 ${
                c.tone === "risk"
                  ? "text-risk"
                  : c.tone === "safe"
                  ? "text-safe"
                  : "text-ink"
              }`}
            >
              {c.v}
            </div>
            <div className="font-mono text-[9px] text-ink4 mt-0.5">{c.s}</div>
          </div>
        ))}
      </div>

      {/* verdict line */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 border-t font-mono text-[10px] ${
          sel?.fp
            ? "border-risk/30 bg-risk/5 text-risk"
            : isOptimal
            ? "border-safe/30 bg-safe/5 text-safe"
            : "border-line text-ink2"
        }`}
      >
        {sel?.fp ? (
          <>
            <AlertTriangle size={12} /> τ={tau} fires during calm market — false
            evacuation risk.
          </>
        ) : isOptimal ? (
          <>
            <Target size={12} /> τ={tau} on the optimal plateau [{summary?.plateauLo}–
            {summary?.plateauHi}] · max funds saved, 0 false-positive.
          </>
        ) : (
          <>
            τ={tau} reliable but late — {delta < 0 ? usdCompact(delta) : "+" + usdCompact(delta)} vs τ*.
          </>
        )}
      </div>
    </div>
  );
}
