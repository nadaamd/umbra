# Umbra — Frontend

> **Institutional Terminal** for the autonomous DeFi circuit breaker.
> High-density, data-centric risk dashboard — Bloomberg/Paradigm aesthetic, zero slop.

Next.js (App Router) · TypeScript · Tailwind · Recharts · Lucide.

## Run

```bash
cd frontend
pnpm install
pnpm dev            # http://localhost:3000
# prod: pnpm build && pnpm start
```

> Note: another app already listens on :3000 in this repo — run the frontend on a
> free port with `pnpm exec next start -p 3939` if needed.

## What it shows

The whole terminal replays the **real USDC/SVB depeg (March 2023)** candle-by-candle
(data extracted by `quant-backtest`). The breaker walks **SAFE → ARMED → TRIGGERED**
live as CBRI climbs, evacuates at the optimal threshold **τ\* = 66**, exiting at
**\$1.0000** while the depeg bottomed at **\$0.873** → **+\$126.9k saved** on \$1M.

Four screens (per the brief):
1. **CBRI Core** + **Risk Evolution** — global 0–100 risk gauge, CBRI ∥ USDC over time.
2. **Pool Monitor** — target Uniswap v3 pool, TVL, price divergence, order-flow imbalance.
3. **Backtest Simulator** — interactive τ slider, funds-saved curve, reliable vs false-positive zones, slippage.
4. **Execution & Status** — breaker state + 1inch best-exec USDC→USDT evacuation log.

Replay transport (bottom bar): play/pause, speed, scrub, **jump-to-trip**.

## 🔌 Backend integration — the ONE file to touch

Everything reads through `lib/data.ts`. Today it returns **bundled seed JSON**
(`public/seed/*.json`, generated from `quant-backtest/output/*.csv`). To go live,
replace the three getters with calls to the quant backend / The Graph / 1inch —
**the return types are the contract** (`lib/types.ts`), nothing else changes:

| Getter (`lib/data.ts`) | Returns | Live source |
|---|---|---|
| `getSeries()` | `CbriPoint[]` | quant CBRI stream (The Graph → `features.py`) |
| `getSweep()` | `SweepRow[]` | `backtest.py` τ-sweep |
| `getSummary()` | `Summary` | `backtest.py` τ\* selection |

HTTP surface already wired (swap the handlers' data source, keep the shapes):

- `GET /api/cbri/series` → `CbriPoint[]`
- `GET /api/backtest/sweep` → `{ sweep: SweepRow[], summary: Summary }`
- `GET /api/summary` → `Summary`

For a **live feed**, point `lib/store.tsx` at a WebSocket/SSE that pushes new
`CbriPoint`s and flip the replay clock off — the status logic (`deriveStatus`) and
all panels already consume `current` reactively.

## Design system

Dark-committed "institutional terminal" (`tailwind.config.ts`): functional colors
only — `risk`/`safe`/`armed` reserved status hues (always icon + label, never
color-alone), a CVD-validated categorical trio, technical greys. Mono for all data
(JetBrains Mono), tabular numbers everywhere. No glassmorphism, no neon, no glow.
Charts follow single-axis discipline (CBRI and price are stacked panels sharing the
x-axis, never a dual-axis).
