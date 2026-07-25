"use client";

import {
  AreaChart,
  Area,
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
import { armThreshold } from "@/lib/data";
import { hhmm, stamp, price4 } from "@/lib/format";

const MARGIN = { top: 6, right: 16, bottom: 0, left: 34 };

function CbriTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-line2 bg-bg/95 backdrop-blur px-2.5 py-1.5 rounded-sm font-mono text-[10px] tabular-nums shadow-lg">
      <div className="text-ink3 mb-1">{stamp(p.t)} UTC</div>
      <div className="flex justify-between gap-4">
        <span className="text-risk">CBRI</span>
        <span className="text-ink">{p.cbri.toFixed(1)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-ink2">USDC</span>
        <span className="text-ink">{price4(p.usdc)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-s2">drain</span>
        <span className="text-ink">{p.drain.toFixed(1)}%/h</span>
      </div>
    </div>
  );
}

export function CbriChart() {
  const { visible, series, summary, triggerIdx, triggered } = useBreaker();
  const tau = summary?.tauStar ?? 66;
  const arm = armThreshold(tau);
  const start = summary?.startTs ?? series[0]?.t;
  const end = summary?.endTs ?? series[series.length - 1]?.t;
  const domain: [number, number] = [start ?? 0, end ?? 1];

  const trig = triggerIdx >= 0 ? series[triggerIdx] : null;
  const showTrig = triggered && trig;

  const xTicks =
    start && end
      ? Array.from({ length: 4 }, (_, k) => start + ((end - start) * (k + 1)) / 5)
      : [];

  return (
    <div className="flex flex-col h-full">
      {/* CBRI area */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible} margin={MARGIN} syncId="cb">
            <defs>
              <linearGradient id="cbriFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff2233" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#ff2233" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              type="number"
              domain={domain}
              ticks={xTicks}
              tickFormatter={hhmm}
              tickLine={false}
              axisLine={{ stroke: "#211e19" }}
              tick={{ fontSize: 10 }}
              hide
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              width={30}
              tick={{ fontSize: 10, fill: "#6a6357" }}
              orientation="left"
            />
            <ReferenceLine y={arm} stroke="#f2a93b" strokeDasharray="2 3" strokeOpacity={0.5} />
            <ReferenceLine
              y={tau}
              stroke="#ff2233"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{
                value: `τ* ${tau}`,
                position: "right",
                fill: "#ff2233",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <Area
              dataKey="cbri"
              stroke="#ff2233"
              strokeWidth={1.6}
              fill="url(#cbriFill)"
              isAnimationActive={false}
              dot={false}
            />
            {showTrig && (
              <ReferenceDot
                x={trig!.t}
                y={trig!.cbri}
                r={4}
                fill="#35c07a"
                stroke="#050505"
                strokeWidth={1.5}
              />
            )}
            <Tooltip
              content={<CbriTooltip />}
              cursor={{ stroke: "#423d34", strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="px-3 py-1 border-t border-line flex items-center justify-between">
        <span className="label">USDC / USD · depeg signal</span>
        {showTrig && (
          <span className="font-mono text-[10px] text-safe tabular-nums">
            ⎇ EVAC @ {price4(trig!.usdc)} · {stamp(trig!.t)}
          </span>
        )}
      </div>

      {/* Price strip */}
      <div className="h-[92px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ ...MARGIN, bottom: 4 }} syncId="cb">
            <XAxis
              dataKey="t"
              type="number"
              domain={domain}
              ticks={xTicks}
              tickFormatter={hhmm}
              tickLine={false}
              axisLine={{ stroke: "#211e19" }}
              tick={{ fontSize: 10, fill: "#6a6357" }}
            />
            <YAxis
              domain={[0.85, 1.01]}
              ticks={[0.9, 1.0]}
              tickFormatter={(v) => v.toFixed(2)}
              tickLine={false}
              axisLine={false}
              width={30}
              tick={{ fontSize: 10, fill: "#6a6357" }}
            />
            <ReferenceLine y={1} stroke="#423d34" strokeDasharray="2 3" />
            {summary && (
              <ReferenceLine
                y={summary.usdcTrough}
                stroke="#ff2233"
                strokeDasharray="1 4"
                strokeOpacity={0.6}
                label={{
                  value: `trough ${summary.usdcTrough.toFixed(3)}`,
                  position: "insideBottomRight",
                  fill: "#ff2233",
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}
            <Line
              dataKey="usdc"
              stroke="#cfc7b5"
              strokeWidth={1.4}
              isAnimationActive={false}
              dot={false}
            />
            {showTrig && (
              <ReferenceDot
                x={trig!.t}
                y={trig!.usdc}
                r={3.5}
                fill="#35c07a"
                stroke="#050505"
                strokeWidth={1.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
