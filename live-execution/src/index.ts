import { CONFIG } from "./config.js";
import { loadCbriSeries } from "./feed.js";
import { evacuate } from "./breaker.js";

/**
 * Umbra — moteur d'exécution.
 *
 *   npm run demo              rejoue le depeg USDC ; le breaker fire à CBRI ≥ τ*
 *   npm run fire -- 80        teste un déclenchement à CBRI = 80
 *   tsx src/index.ts          surveille un flux (à brancher en prod)
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function replay() {
  console.log(`\n🎬 REPLAY — Depeg USDC (SVB, mars 2023)   τ* = ${CONFIG.TAU_STAR}   position = $${CONFIG.POSITION_USDC.toLocaleString()}\n`);
  const series = loadCbriSeries();
  let armed = true;
  for (const t of series) {
    // barre de risque ASCII pour la démo
    const bar = "█".repeat(Math.round(t.cbri / 5)).padEnd(20, "·");
    const flag = t.cbri >= CONFIG.TAU_STAR ? " ⚠️" : "";
    process.stdout.write(`\r${t.dt.slice(5, 16)}  USDC $${t.usdcUsd.toFixed(4)}  CBRI ${bar} ${t.cbri.toFixed(0).padStart(3)}${flag}   `);
    if (armed && t.cbri >= CONFIG.TAU_STAR) {
      armed = false; // on n'évacue qu'une fois
      await evacuate({ cbri: t.cbri, usdcUsd: t.usdcUsd, dt: t.dt });
      console.log("\n▶️  Position à l'abri en USDT. Le disjoncteur reste armé pour la suite.\n");
      break; // démo : on s'arrête au déclenchement
    }
    await sleep(12); // accéléré pour la démo
  }
}

async function fireAt(cbri: number) {
  console.log(`\n🧪 Test de déclenchement à CBRI = ${cbri} (τ* = ${CONFIG.TAU_STAR})`);
  if (cbri < CONFIG.TAU_STAR) {
    console.log("   CBRI < τ* → pas d'évacuation. Rien à faire.");
    return;
  }
  await evacuate({ cbri, usdcUsd: NaN });
}

const args = process.argv.slice(2);
if (args.includes("--replay")) {
  replay().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
} else if (args.includes("--cbri")) {
  const v = Number(args[args.indexOf("--cbri") + 1] ?? args[args.length - 1]);
  fireAt(Number.isFinite(v) ? v : 80).catch((e) => { console.error("❌", e.message); process.exit(1); });
} else {
  console.log("Usage: npm run demo   |   npm run fire -- <cbri>   |   tsx src/index.ts --replay");
}
