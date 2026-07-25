import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { positionRaw, CONFIG } from "../src/config.js";
import { slippageBps } from "../src/uniswap.js";
import { minOut } from "../src/breaker.js";
import { loadCbriSeries } from "../src/feed.js";

// ── config : conversion de la position en unités brutes ──────
test("positionRaw : $1M USDC -> 1e12 unités brutes (6 déc.)", () => {
  assert.equal(positionRaw(), 1_000_000_000_000n);
});

// ── slippage en bps ──────────────────────────────────────────
test("slippageBps : sortie = entrée -> 0 bps", () => {
  assert.equal(slippageBps(1_000_000, 1_000_000), 0);
});

test("slippageBps : perte de 1% -> 100 bps", () => {
  assert.ok(Math.abs(slippageBps(1_000_000, 990_000) - 100) < 1e-6);
});

test("slippageBps : prix favorable -> borné à 0 (pas un coût)", () => {
  assert.equal(slippageBps(1_000_000, 1_000_699), 0);
});

// ── minOut : protection de l'ordre ───────────────────────────
test("minOut : tolérance 1% retire 1% du montant attendu", () => {
  assert.equal(minOut(1_000_000_000_000n, CONFIG.MAX_SLIPPAGE_PCT), 990_000_000_000n);
});

test("minOut : tolérance 0% -> montant inchangé", () => {
  assert.equal(minOut(1_000_000_000_000n, 0), 1_000_000_000_000n);
});

test("minOut : 0 en entrée -> 0", () => {
  assert.equal(minOut(0n, 1), 0n);
});

// ── feed : parsing du flux CBRI ──────────────────────────────
test("loadCbriSeries : parse le CSV du back en ticks typés", () => {
  const p = join(tmpdir(), `cbri_test_${process.pid}.csv`);
  writeFileSync(
    p,
    "candle,dt,usdc_usd,cbri\n" +
      "1678406400,2023-03-10 00:00:00+00:00,0.9995,7.5\n" +
      "1678518000,2023-03-11 07:00:00+00:00,0.8726,100\n",
  );
  try {
    const s = loadCbriSeries(p);
    assert.equal(s.length, 2);
    assert.deepEqual(s[0], { ts: 1678406400, dt: "2023-03-10 00:00:00+00:00", usdcUsd: 0.9995, cbri: 7.5 });
    assert.equal(s[1].cbri, 100);
    assert.equal(s[1].usdcUsd, 0.8726);
  } finally {
    rmSync(p, { force: true });
  }
});
