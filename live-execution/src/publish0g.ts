import { writeFileSync } from "node:fs";
import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import { createHash } from "node:crypto";
import { CONFIG, CBRI_MODEL_SPEC } from "./config.js";
import { loadCbriSeries } from "./feed.js";

/**
 * Traçabilité 0G — ancre le modèle CBRI + la série de scores sur 0G Storage.
 *
 * Pourquoi : un disjoncteur qu'on doit croire aveuglément ne vaut rien. Chaque
 * score et le modèle exact qui l'a produit sont figés dans une attestation,
 * dont le root hash (Merkle 0G) est publié sur le stockage décentralisé 0G.
 * N'importe qui peut re-télécharger l'artefact et vérifier le hash.
 *
 *  - Le root hash 0G se calcule EN LOCAL (aucun wallet requis).
 *  - L'upload réel sur 0G testnet nécessite ZEROG_PRIVATE_KEY (gas testnet).
 */

function buildAttestation() {
  const series = loadCbriSeries();
  const scores = series.map((t) => ({ ts: t.ts, cbri: Number(t.cbri.toFixed(2)), usdc_usd: Number(t.usdcUsd.toFixed(6)) }));
  const seriesDigest = createHash("sha256")
    .update(JSON.stringify(scores))
    .digest("hex");
  return {
    schema: "circuitbreaker.ai/attestation/v1",
    model: CBRI_MODEL_SPEC,
    dataset: {
      crash: "USDC_depeg_SVB_2023-03",
      pool_usdc_weth: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
      pool_usdc_usdt: "0x3416cf6c708da44db2624d63ea0aaef7113527c6",
      source: "The Graph — Uniswap v3 subgraph",
      points: scores.length,
      window_ts: [scores[0]?.ts, scores[scores.length - 1]?.ts],
    },
    scores_sha256: seriesDigest,
    scores,
  };
}

async function main() {
  const attestation = buildAttestation();
  writeFileSync(CONFIG.ATTESTATION_JSON, JSON.stringify(attestation, null, 2));
  console.log(`\n📝 Attestation CBRI construite : ${attestation.dataset.points} scores`);
  console.log(`   digest scores (sha256) : ${attestation.scores_sha256.slice(0, 32)}…`);

  // ── Root hash 0G (Merkle) — calcul LOCAL, sans wallet ──────
  // try/finally : le handle est TOUJOURS fermé, même si merkleTree/upload lève.
  const file = await ZgFile.fromFilePath(CONFIG.ATTESTATION_JSON);
  try {
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr !== null || !tree) {
      throw new Error(`Calcul Merkle 0G échoué : ${treeErr}`);
    }
    const rootHash = tree.rootHash();
    console.log(`\n🌳 0G Storage root hash : ${rootHash}`);
    console.log(`   → c'est l'ancre de traçabilité vérifiable (indépendante du wallet).`);

    // ── Upload réel sur 0G testnet (si wallet financé) ─────────
    if (!CONFIG.ZEROG_PRIVATE_KEY) {
      console.log(`\n⏭️  Upload 0G sauté : ZEROG_PRIVATE_KEY absente.`);
      console.log(`   Pour publier réellement : wallet testnet 0G financé (faucet) dans .env,`);
      console.log(`   puis relance — l'artefact sera stocké sur 0G et adressable par ce root hash.`);
      return;
    }

    console.log(`\n⛓️  Upload sur 0G testnet…`);
    const provider = new ethers.JsonRpcProvider(CONFIG.ZEROG_RPC);
    const signer = new ethers.Wallet(CONFIG.ZEROG_PRIVATE_KEY, provider);
    const indexer = new Indexer(CONFIG.ZEROG_INDEXER);
    // cast: ethers est en double build (ESM/CJS) entre notre code et le SDK 0G ;
    // le Wallet est structurellement un Signer valide au runtime.
    const [tx, upErr] = await indexer.upload(file, CONFIG.ZEROG_RPC, signer as never);
    if (upErr !== null) {
      throw new Error(`Upload 0G échoué : ${upErr}`);
    }
    console.log(`   ✅ publié sur 0G — tx : ${tx}`);
    console.log(`   🔎 ${CONFIG.ZEROG_EXPLORER}/${tx}`);
    console.log(`   root hash : ${rootHash}`);
  } finally {
    await file.close();
  }
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
