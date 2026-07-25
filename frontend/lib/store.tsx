"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import type {
  CbriPoint,
  SweepRow,
  Summary,
  BreakerStatus,
  ExecutionLeg,
} from "./types";
import { deriveStatus } from "./data";

interface BreakerCtx {
  ready: boolean;
  series: CbriPoint[];
  sweep: SweepRow[];
  summary: Summary | null;
  /** playhead index into series */
  i: number;
  /** slice of series up to and including the playhead */
  visible: CbriPoint[];
  current: CbriPoint | null;
  status: BreakerStatus;
  /** first index where cbri ≥ τ* (evacuation candle), or -1 */
  triggerIdx: number;
  triggered: boolean;
  playing: boolean;
  speed: number;
  execution: ExecutionLeg[];
  // controls
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setSpeed: (s: number) => void;
  scrub: (i: number) => void;
  reset: () => void;
  jumpToTrigger: () => void;
}

const Ctx = createContext<BreakerCtx | null>(null);

const TICK_MS = 90;

/** Deterministic Uniswap evacuation legs for the demo execution log. */
function buildExecution(summary: Summary, triggerTs: number): ExecutionLeg[] {
  const total = summary.position;
  // A best-execution split across venues, weights summing to 1.
  const split: [string, number][] = [
    ["Uniswap v3", 0.42],
    ["Curve 3pool", 0.31],
    ["PancakeSwap v3", 0.16],
    ["Sushi", 0.11],
  ];
  return split.map(([venue, w], k) => ({
    id: `leg-${k}`,
    ts: triggerTs + k * 3,
    venue,
    fromToken: "USDC",
    toToken: summary.safeAsset,
    amountUsd: Math.round(total * w),
    priceImpactBps: Number((summary.exitSlipBps * (0.7 + 0.2 * k)).toFixed(1)),
    status: "CONFIRMED" as const,
    txHash: `0x${(k + 3).toString(16)}${"a7f3c9d21e8b4605".repeat(2)}`.slice(0, 42),
  }));
}

export function BreakerProvider({ children }: { children: React.ReactNode }) {
  const [series, setSeries] = useState<CbriPoint[]>([]);
  const [sweep, setSweep] = useState<SweepRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load data once.
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/cbri/series").then((r) => r.json()),
      fetch("/api/backtest/sweep").then((r) => r.json()),
    ]).then(([s, b]) => {
      if (!alive) return;
      setSeries(s as CbriPoint[]);
      setSweep(b.sweep as SweepRow[]);
      setSummary(b.summary as Summary);
      setPlaying(true); // auto-run the replay on load
    });
    return () => {
      alive = false;
    };
  }, []);

  // Replay clock.
  useEffect(() => {
    if (!playing || series.length === 0) return;
    raf.current = setInterval(() => {
      setI((prev) => {
        const next = prev + speed;
        if (next >= series.length - 1) {
          setPlaying(false);
          return series.length - 1;
        }
        return next;
      });
    }, TICK_MS);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [playing, speed, series.length]);

  const tauStar = summary?.tauStar ?? 66;

  const triggerIdx = useMemo(() => {
    if (series.length === 0) return -1;
    return series.findIndex((p) => p.cbri >= tauStar);
  }, [series, tauStar]);

  const current = series[i] ?? null;
  const status: BreakerStatus = current
    ? deriveStatus(current.cbri, tauStar)
    : "SAFE";
  const triggered = triggerIdx >= 0 && i >= triggerIdx;

  const visible = useMemo(() => series.slice(0, i + 1), [series, i]);

  const execution = useMemo(() => {
    if (!summary || !triggered || triggerIdx < 0) return [];
    return buildExecution(summary, series[triggerIdx].t);
  }, [summary, triggered, triggerIdx, series]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const scrub = useCallback((n: number) => {
    setPlaying(false);
    setI(n);
  }, []);
  const reset = useCallback(() => {
    setI(0);
    setPlaying(true);
  }, []);
  const jumpToTrigger = useCallback(() => {
    if (triggerIdx >= 0) {
      setPlaying(false);
      setI(Math.min(triggerIdx + 2, series.length - 1));
    }
  }, [triggerIdx, series.length]);

  const value: BreakerCtx = {
    ready: series.length > 0 && !!summary,
    series,
    sweep,
    summary,
    i,
    visible,
    current,
    status,
    triggerIdx,
    triggered,
    playing,
    speed,
    execution,
    play,
    pause,
    toggle,
    setSpeed,
    scrub,
    reset,
    jumpToTrigger,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBreaker(): BreakerCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBreaker must be used within BreakerProvider");
  return c;
}
