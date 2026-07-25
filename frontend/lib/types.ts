/**
 * Data contracts for CircuitBreaker.ai frontend.
 *
 * These mirror the quant-backtest output exactly (see quant-backtest/features.py
 * and backtest.py). The frontend reads them today from bundled seed JSON
 * (real USDC/SVB-depeg data, March 2023); the backend team swaps the loader in
 * lib/data.ts for live endpoints — the shapes below are the integration boundary.
 */

export type BreakerStatus = "SAFE" | "ARMED" | "TRIGGERED";

/** One 5-minute candle of the CBRI panel. */
export interface CbriPoint {
  /** candle open, unix seconds (UTC) */
  t: number;
  /** Circuit Breaker Risk Index, 0–100 */
  cbri: number;
  /** USDC/USD price (the depeg signal); 1.0 at peg, 0.873 at SVB trough */
  usdc: number;
  /** USDC per WETH (target pool spot) */
  weth: number;
  /** liquidity drain rate, % of TVL per hour (ΔL/Δt, clamped ≥ 0) */
  drain: number;
  /** order-flow imbalance, 0–1 (diagnostic, down-weighted on this crash) */
  ofi: number;
  /** sub-signal sigmoids feeding the Noisy-OR, each 0–1 */
  sDrain: number;
  sOfi: number;
  sDepeg: number;
  /** swap volume in the candle, USD */
  vol: number;
  /** target pool TVL, USD */
  tvl: number;
  /** net liquidity flow in the candle (mints − burns), USD */
  netLiq: number;
  /** swap count in the candle */
  nSwaps: number;
}

/** One row of the τ (threshold) sweep — the backtest simulator's backbone. */
export interface SweepRow {
  /** trigger threshold on CBRI, 10–99 */
  tau: number;
  /** ISO timestamp of the first candle crossing τ */
  triggerDt: string;
  /** USDC price at evacuation */
  exitPrice: number;
  /** evacuation slippage, basis points */
  exitSlipBps: number;
  /** USDT received after slippage, USD */
  valueOut: number;
  /** funds saved vs. riding to the trough, USD */
  fundsSaved: number;
  /** 1 if this τ also fires during the calm window (false positive) */
  fp: number;
}

/** Backtest headline, precomputed at τ*. */
export interface Summary {
  crash: string;
  pool: string;
  poolAddr: string;
  depegPool: string;
  startTs: number;
  endTs: number;
  candleSec: number;
  position: number;
  safeAsset: string;
  usdcTrough: number;
  troughTs: number;
  cbriPeak: number;
  peakTs: number;
  tauStar: number;
  plateauLo: number;
  plateauHi: number;
  triggerDt: string;
  exitPrice: number;
  exitSlipBps: number;
  valueOut: number;
  fundsSaved: number;
  successFee: number;
}

/** An emergency-evacuation swap leg, as it would stream from 1inch execution. */
export interface ExecutionLeg {
  id: string;
  ts: number;
  venue: string;
  fromToken: string;
  toToken: string;
  amountUsd: number;
  priceImpactBps: number;
  status: "ROUTING" | "FILLED" | "CONFIRMED";
  txHash?: string;
}

/** Live breaker state — the top-level status object. */
export interface BreakerState {
  status: BreakerStatus;
  cbri: number;
  tauStar: number;
  usdc: number;
  drain: number;
  updatedTs: number;
}
