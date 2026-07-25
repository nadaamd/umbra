import { createWalletClient, http, publicActions, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { CONFIG, positionRaw } from "./config.js";
import { getQuote, buildSwapTx } from "./oneinch.js";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/**
 * Évacuation d'urgence. Déclenchée quand CBRI ≥ τ*.
 *  - DRY_RUN (défaut) : quote 1inch réelle + plan d'exécution, sans envoyer.
 *  - LIVE : construit + signe + envoie la tx via 1inch (wallet requis).
 */
export async function evacuate(ctx: { cbri: number; usdcUsd: number; dt?: string }) {
  const amount = positionRaw();
  console.log("\n🛑 ─────────────────────────────────────────────");
  console.log(`🛑  DISJONCTEUR DÉCLENCHÉ  —  CBRI = ${ctx.cbri.toFixed(0)} ≥ τ* = ${CONFIG.TAU_STAR}`);
  if (ctx.dt) console.log(`🛑  t = ${ctx.dt}   USDC = $${ctx.usdcUsd.toFixed(4)}`);
  console.log(`🛑  Évacuation : ${fmt(CONFIG.POSITION_USDC)} USDC → USDT (1inch best-execution)`);
  console.log("🛑 ─────────────────────────────────────────────");

  let quote: { outUsdt: number; slippageBps: number };
  try {
    quote = await getQuote(amount);
    console.log(`   route 1inch  : ${fmt(quote.outUsdt)} USDT en sortie (quote LIVE)`);
  } catch (e) {
    // Démo robuste : si la clé 1inch manque/échoue, on modélise (5 bps calme).
    quote = { outUsdt: CONFIG.POSITION_USDC * (1 - 0.0005), slippageBps: 5 };
    console.log(`   route 1inch  : ${fmt(quote.outUsdt)} USDT (modélisé — clé 1inch absente)`);
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
  const account = privateKeyToAccount(CONFIG.EXECUTION_PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(CONFIG.RPC_URL),
  }).extend(publicActions);

  const tx = await buildSwapTx(amount, account.address);
  console.log(`   exécuteur    : ${account.address}`);
  const hash = await client.sendTransaction({ to: tx.to, data: tx.data, value: tx.value });
  console.log(`   ✅ tx envoyée : ${hash}`);
  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log(`   ✅ minée bloc ${receipt.blockNumber} (${receipt.status})`);
  return { executed: true, hash, outUsdt: Number(formatUnits(tx.dstAmount, CONFIG.USDT_DECIMALS)) };
}
