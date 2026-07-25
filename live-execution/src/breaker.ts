import { CONFIG, positionRaw } from "./config.js";
import { getQuote, executeSwap } from "./uniswap.js";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/** Sortie minimale acceptée = dstAmount · (1 − tolérance%). Protège l'ordre. */
export function minOut(dstAmount: bigint, maxSlippagePct: number): bigint {
  return (dstAmount * BigInt(Math.round((100 - maxSlippagePct) * 100))) / 10000n;
}

/**
 * Évacuation d'urgence. Déclenchée quand CBRI ≥ τ*.
 *  - DRY_RUN (défaut) : quote Uniswap LIVE (read on-chain) + plan, sans envoyer.
 *  - LIVE : approve + swap on-chain via SwapRouter02 (wallet requis).
 */
export async function evacuate(ctx: { cbri: number; usdcUsd: number; dt?: string }) {
  const amount = positionRaw();
  console.log("\n🛑 ─────────────────────────────────────────────");
  console.log(`🛑  DISJONCTEUR DÉCLENCHÉ  —  CBRI = ${ctx.cbri.toFixed(0)} ≥ τ* = ${CONFIG.TAU_STAR}`);
  if (ctx.dt) console.log(`🛑  t = ${ctx.dt}   USDC = $${ctx.usdcUsd.toFixed(4)}`);
  console.log(`🛑  Évacuation : ${fmt(CONFIG.POSITION_USDC)} USDC → USDT (Uniswap v3, on-chain)`);
  console.log("🛑 ─────────────────────────────────────────────");

  let quote: { outUsdt: number; slippageBps: number; dstAmount: bigint };
  try {
    quote = await getQuote(amount);
    console.log(`   quote Uniswap : ${fmt(quote.outUsdt)} USDT en sortie (LIVE on-chain, QuoterV2)`);
  } catch (e) {
    quote = { outUsdt: CONFIG.POSITION_USDC * (1 - 0.0005), slippageBps: 5, dstAmount: 0n };
    console.log(`   quote Uniswap : ${fmt(quote.outUsdt)} USDT (modélisé — RPC indisponible)`);
  }
  console.log(`   slippage     : ${quote.slippageBps.toFixed(1)} bps`);

  if (CONFIG.DRY_RUN) {
    console.log("   mode         : DRY-RUN (aucune tx envoyée)");
    console.log("   → passe DRY_RUN=false + EXECUTION_PRIVATE_KEY pour exécuter réellement.");
    return { executed: false, outUsdt: quote.outUsdt };
  }

  if (!CONFIG.EXECUTION_PRIVATE_KEY) {
    throw new Error("Mode LIVE mais EXECUTION_PRIVATE_KEY absente dans .env.");
  }
  const minAcceptable = minOut(quote.dstAmount, CONFIG.MAX_SLIPPAGE_PCT);
  console.log(`   exécution    : swap on-chain (min sortie ${fmt(Number(minAcceptable) / 1e6)} USDT)…`);
  const hash = await executeSwap(amount, minAcceptable);
  console.log(`   ✅ tx envoyée : ${hash}`);
  return { executed: true, hash, outUsdt: quote.outUsdt };
}
