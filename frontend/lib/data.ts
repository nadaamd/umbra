/**
 * Server-side data access. TODAY: reads bundled seed JSON (real USDC/SVB-depeg
 * data). TO GO LIVE: replace the three getters below with calls to the quant
 * backend (The Graph / 0G stream) and Uniswap — the return types are the contract.
 */
import seriesSeed from "@/public/seed/cbri_series.json";
import sweepSeed from "@/public/seed/tau_sweep.json";
import summarySeed from "@/public/seed/summary.json";
import type { BreakerStatus, CbriPoint, SweepRow, Summary } from "./types";

export function getSeries(): CbriPoint[] {
  return seriesSeed as CbriPoint[];
}

export function getSweep(): SweepRow[] {
  return sweepSeed as SweepRow[];
}

export function getSummary(): Summary {
  return summarySeed as Summary;
}

/** ── Pure status logic (shared client + server) ───────────────────────── */

/** Below this fraction of τ*, the breaker is fully SAFE. */
export const ARM_FRACTION = 0.6;

export function armThreshold(tauStar: number): number {
  return Math.round(tauStar * ARM_FRACTION);
}

export function deriveStatus(cbri: number, tauStar: number): BreakerStatus {
  if (cbri >= tauStar) return "TRIGGERED";
  if (cbri >= armThreshold(tauStar)) return "ARMED";
  return "SAFE";
}

/** Interpolate a SweepRow for an arbitrary τ (the simulator slider). */
export function sweepAt(sweep: SweepRow[], tau: number): SweepRow | null {
  if (sweep.length === 0) return null;
  const exact = sweep.find((r) => r.tau === tau);
  if (exact) return exact;
  // clamp to range
  const lo = sweep[0];
  const hi = sweep[sweep.length - 1];
  if (tau <= lo.tau) return lo;
  if (tau >= hi.tau) return hi;
  return sweep.reduce((best, r) =>
    Math.abs(r.tau - tau) < Math.abs(best.tau - tau) ? r : best
  );
}
