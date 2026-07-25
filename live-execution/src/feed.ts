import { readFileSync } from "node:fs";
import { CONFIG } from "./config.js";

/**
 * Flux CBRI = le cerveau Python qui parle aux muscles TS.
 * En prod : score poussé en continu par le pipeline (The Graph -> CBRI -> 0G).
 * En démo : on rejoue le score historique du depeg USDC, bougie par bougie.
 */
export interface Tick {
  ts: number;
  dt: string;
  usdcUsd: number;
  cbri: number;
}

export function loadCbriSeries(): Tick[] {
  let raw: string;
  try {
    raw = readFileSync(CONFIG.CBRI_CSV, "utf8");
  } catch {
    throw new Error(
      `Flux CBRI introuvable (${CONFIG.CBRI_CSV}).\n` +
        `Lance d'abord le back : cd ../quant-backtest && python features.py`,
    );
  }
  const lines = raw.trim().split("\n");
  const head = lines[0].split(",");
  const iTs = head.indexOf("candle");
  const iDt = head.indexOf("dt");
  const iPx = head.indexOf("usdc_usd");
  const iCb = head.indexOf("cbri");
  return lines.slice(1).map((l) => {
    const c = l.split(",");
    return {
      ts: Number(c[iTs]),
      dt: c[iDt],
      usdcUsd: Number(c[iPx]),
      cbri: Number(c[iCb]),
    };
  });
}
