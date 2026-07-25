"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useBreaker } from "@/lib/store";
import { hhmm, stamp } from "@/lib/format";

const DRAIN_THRESHOLD = 6; // %/h (config.DRAIN_THRESHOLD * 100)

function DrainTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-line2 bg-bg/95 px-2 py-1 rounded-sm font-mono text-[10px] tabular-nums">
      <span className="text-ink3">{stamp(p.t)}</span>{" "}
      <span className="text-s2">{p.drain.toFixed(1)}%/h</span>
    </div>
  );
}

export function DrainChart() {
  const { visible, series, summary, current } = useBreaker();
  const start = summary?.startTs ?? series[0]?.t;
  const end = summary?.endTs ?? series[series.length - 1]?.t;
  const cur = current?.drain ?? 0;
  const overThreshold = cur >= DRAIN_THRESHOLD;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="label">ΔL / Δt · liquidity flight rate</span>
        <span
          className={`font-mono text-[11px] tabular-nums ${
            overThreshold ? "text-s2" : "text-ink2"
          }`}
        >
          {cur.toFixed(1)}
          <span className="text-ink4">%/h</span>
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visible}
            margin={{ top: 4, right: 12, bottom: 2, left: 30 }}
          >
            <defs>
              <linearGradient id="drainFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d95926" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#d95926" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              type="number"
              domain={[start ?? 0, end ?? 1]}
              tickFormatter={hhmm}
              tickLine={false}
              axisLine={{ stroke: "#211e19" }}
              tick={{ fontSize: 9, fill: "#6a6357" }}
              minTickGap={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fontSize: 9, fill: "#6a6357" }}
              tickFormatter={(v) => `${v}`}
            />
            <ReferenceLine
              y={DRAIN_THRESHOLD}
              stroke="#f2a93b"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              label={{
                value: "knee 6%/h",
                position: "insideTopRight",
                fill: "#f2a93b",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
            />
            <Area
              dataKey="drain"
              stroke="#d95926"
              strokeWidth={1.5}
              fill="url(#drainFill)"
              isAnimationActive={false}
              dot={false}
            />
            <Tooltip
              content={<DrainTip />}
              cursor={{ stroke: "#423d34", strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
