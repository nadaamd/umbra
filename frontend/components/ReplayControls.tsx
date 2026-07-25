"use client";

import { useBreaker } from "@/lib/store";
import { Chip } from "./ui";
import { stamp } from "@/lib/format";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";

const SPEEDS: [string, number][] = [
  ["1×", 1],
  ["2×", 3],
  ["4×", 6],
  ["8×", 12],
];

export function ReplayControls() {
  const {
    playing,
    toggle,
    reset,
    speed,
    setSpeed,
    i,
    series,
    scrub,
    current,
    triggerIdx,
    jumpToTrigger,
  } = useBreaker();

  const len = Math.max(1, series.length - 1);
  const trigPct = triggerIdx >= 0 ? (triggerIdx / len) * 100 : -1;

  return (
    <div className="h-12 shrink-0 border-t border-line bg-panel flex items-center gap-3 px-4">
      {/* transport */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="w-8 h-8 grid place-items-center border border-line2 rounded-sm text-ink hover:border-ink3 bg-bg"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={reset}
          className="w-8 h-8 grid place-items-center border border-line2 rounded-sm text-ink3 hover:text-ink hover:border-ink3 bg-bg"
          title="Restart replay"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={jumpToTrigger}
          disabled={triggerIdx < 0}
          className="h-8 px-2 flex items-center gap-1 border border-line2 rounded-sm text-risk hover:border-risk/50 bg-bg disabled:opacity-40 font-mono text-[10px] uppercase tracking-wide"
          title="Jump to evacuation"
        >
          <Zap size={12} /> trip
        </button>
      </div>

      {/* speed */}
      <div className="flex items-center gap-1">
        <span className="label mr-0.5">speed</span>
        {SPEEDS.map(([lbl, v]) => (
          <Chip key={lbl} active={speed === v} onClick={() => setSpeed(v)}>
            {lbl}
          </Chip>
        ))}
      </div>

      {/* scrub */}
      <div className="flex-1 relative flex items-center h-full">
        {trigPct >= 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ left: `calc(${trigPct}% )` }}
            title="Evacuation point"
          >
            <div className="w-px h-4 bg-risk" />
          </div>
        )}
        <input
          type="range"
          className="cb-range w-full relative z-0"
          min={0}
          max={len}
          value={i}
          onChange={(e) => scrub(Number(e.target.value))}
        />
      </div>

      {/* readout */}
      <div className="font-mono text-[10px] tabular-nums text-ink3 w-40 text-right shrink-0">
        {current ? stamp(current.t) : "—"}
        <span className="text-ink4"> · {i}/{len}</span>
      </div>
    </div>
  );
}
