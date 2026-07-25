import { CONFIG } from "./config.js";

/** Client 1inch Swap API v6 — quote (dry-run) + construction de tx (live). */

function headers() {
  if (!CONFIG.ONEINCH_API_KEY) {
    throw new Error(
      "ONEINCH_API_KEY manquante dans .env — clé gratuite sur https://portal.1inch.dev/",
    );
  }
  return { Authorization: `Bearer ${CONFIG.ONEINCH_API_KEY}`, accept: "application/json" };
}

async function get(path: string, params: Record<string, string>) {
  const url = `${CONFIG.ONEINCH_BASE}/${CONFIG.CHAIN_ID}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`1inch ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface Quote {
  dstAmount: bigint;
  outUsdt: number;
  slippageBps: number;
}

/** Quote read-only : combien d'USDT pour évacuer la position (aucun wallet requis). */
export async function getQuote(amountRaw: bigint): Promise<Quote> {
  const j = await get("/quote", {
    src: CONFIG.USDC,
    dst: CONFIG.USDT,
    amount: amountRaw.toString(),
  });
  const dstAmount = BigInt(j.dstAmount);
  const outUsdt = Number(dstAmount) / 10 ** CONFIG.USDT_DECIMALS;
  const inUsdc = Number(amountRaw) / 10 ** CONFIG.USDC_DECIMALS;
  const slippageBps = Math.max(0, (1 - outUsdt / inUsdc) * 1e4);
  return { dstAmount, outUsdt, slippageBps };
}

export interface SwapTx {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  dstAmount: bigint;
}

/** Construit la tx d'évacuation signable (mode live) — nécessite l'adresse du wallet. */
export async function buildSwapTx(amountRaw: bigint, from: `0x${string}`): Promise<SwapTx> {
  const j = await get("/swap", {
    src: CONFIG.USDC,
    dst: CONFIG.USDT,
    amount: amountRaw.toString(),
    from,
    origin: from,
    slippage: CONFIG.MAX_SLIPPAGE_PCT.toString(),
    disableEstimate: "true",
  });
  return {
    to: j.tx.to,
    data: j.tx.data,
    value: BigInt(j.tx.value ?? "0"),
    dstAmount: BigInt(j.dstAmount),
  };
}
