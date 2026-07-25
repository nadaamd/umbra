# 🌒 Umbra

> **The autonomous financial circuit breaker for DeFi.**
> Detects systemic risk (liquidity crises, depegs) through a quantitative model, and automatically evacuates users' funds into a safe stablecoin — **before** the pool collapses.

🏆 *ETH Global Lisbon 2026 — Tracks: The Graph · 0G* · (Uniswap v3 execution)

📄 **Research paper** — full risk-score methodology: [PDF](paper/Umbra_CBRI_Paper.pdf) · [Word](paper/Umbra_CBRI_Paper.docx). Single source (`paper/content.py`), regenerable via `python paper/build_paper.py` (Word) and `python paper/build_pdf.py` (PDF).

🎤 **Pitch deck** (math, on-brand 16:9): [`paper/Umbra_Slides.pdf`](paper/Umbra_Slides.pdf) — `python paper/build_slides.py`.  ·  🎬 **Live demo script**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

---

## 🎯 The problem

When a DeFi pool goes into crisis (depeg, liquidity flight), the average user realizes it **too late**: by the time they understand what's happening, liquidity has evaporated and exit slippage has exploded. The losses of March 2023 (USDC depeg), Terra/UST, stETH… run into the **billions**.

## 💡 The solution

An on-chain **circuit breaker** that continuously monitors a **Risk Score (CBRI, 0→100)** and triggers an emergency evacuation as soon as the optimal threshold `τ*` is crossed.

- **Quant model (CBRI)** — 3 signals aggregated via *Noisy-OR*: liquidity-flight speed, pool imbalance, price divergence.
- **Optimal threshold `τ*`** — proven by backtesting on real crashes: the exact point that **maximizes net funds saved**.
- **Aligned business model** — a *success fee* charged only on the loss avoided. We only earn if the user wins.

## 🏗️ Architecture & Sponsors

| Layer | Tech | Role |
|---|---|---|
| **Data** 🏆 | **The Graph** | Historical + real-time Uniswap v3 pool data (tick-level swaps, liquidity, price) |
| **AI / Infra** 🏆 | **0G** | Decentralized storage & traceability of the model and risk scores |
| **Execution** | **Uniswap v3** | Direct on-chain evacuation swap (QuoterV2 + SwapRouter02, no API) |

*🏆 = targeted tracks. Uniswap = data infra + execution (we are not applying to their track).*

> **Backtest vs. production rigor:** the backtest **simulates execution against historical on-chain liquidity** (the pool's real physics via The Graph); live execution reads an **on-chain Uniswap QuoterV2 quote** then swaps via SwapRouter02. We price the past with physics, and execute the present at the pool's real price.

## 📂 Structure

```
umbra/
├── quant-backtest/     # Python — the brain (CBRI model + backtesting)
└── live-execution/     # TypeScript — the muscle (Uniswap execution + 0G traceability)
```

## 📊 Backtest result — USDC depeg (SVB, March 11, 2023)

Replayed on **48,066 real swaps** ($5.57B of volume) extracted via The Graph, for a **$1M USDC position**.

| | |
|---|---|
| **Optimal τ\*** | **66 / 100** (optimal plateau [10–66], 0 false positives in calm markets) |
| **Trigger** | Mar 10, 14:10 UTC — *17h before the bottom*, USDC still at **$1.0000** |
| **Depeg bottom (no action)** | $0.8726 → position worth **$872,595** |
| **💰 Funds saved** | **$126,900 (12.7%)** — 10% success fee = **$12,690** |

**The cost of waiting** (every CBRI point you wait = money lost):

| τ threshold | Exit | Price | Slippage | Saved |
|---|---|---|---|---|
| **10–66 (τ\*)** | Mar 10, 14:10 | **$1.0000** | 5 bps | **$126.9k** |
| 67–72 | Mar 11, 00:15 | $0.9892 | 53 bps | $111.4k |
| 73–98 | Mar 11, 01:00 | $0.9726 | 91 bps | $91.1k |
| 99 | Mar 11, 03:00 | $0.9371 | **657 bps** | $2.9k |

> The active liquidity of the USDC/USDT pool collapses by **×23,000,000** during the crash → exit slippage explodes. Exiting at τ\* = near free; waiting for confirmation = a liquidity wall.

![CBRI vs price](quant-backtest/output/fig1_cbri_vs_price.png)
![Funds saved vs τ](quant-backtest/output/fig2_funds_saved_vs_tau.png)
![Slippage explosion](quant-backtest/output/fig3_slippage_explosion.png)

## 🧮 The model: CBRI (Composite Break-Risk Index)

3 sub-signals normalized by a sigmoid, aggregated via a **weighted Noisy-OR** (a breaker trips if *a single* signal turns red):

```
CBRI = 100 · (1 − ∏ᵢ (1 − wᵢ·sᵢ))        sᵢ = σ(αᵢ·(xᵢ − thresholdᵢ))
```

| Signal | Measure | Role | Source |
|---|---|---|---|
| **Liquidity flight** | LP withdrawal speed (mints−burns / TVL·h) | **early warning** | swaps + mints/burns |
| **Order-Flow Imbalance** | flow unidirectionality | diagnostic (w=0 here, non-discriminant) | swaps |
| **Divergence / depeg** | \|1 − USDC price\| | **confirmation** | USDC/USDT stable pool |

## 🔒 Decentralized traceability (0G)

A circuit breaker you have to trust blindly is worthless. Each risk score **and the exact model that produced it** are frozen into an *attestation*, whose **0G Merkle root hash** is published on **0G** decentralized storage. Anyone can re-download the artifact and verify the hash → **auditable and tamper-proof** scoring.

```bash
cd live-execution && npm run publish0g
# 🌳 0G Storage root hash: 0xc9926d168f786c07df854fa4774528396abee05b57a13fe260f0a64a1d47f90b
```

> The 0G root hash is computed **locally** (no wallet required). The actual upload to the 0G testnet only needs a funded wallet (faucet).

## 🚀 Getting started

```bash
cp .env.example .env      # THEGRAPH_API_KEY (required)  ·  RPC_URL (optional, public default)
cd quant-backtest && pip install -r requirements.txt
python thegraph_client.py   # ① extract the crash data (The Graph)
python features.py          # ② compute the CBRI
python backtest.py          # ③ backtest τ* + figures

cd ../live-execution && npm install
npm run publish0g           # ④ anchor model+scores on 0G (traceability)
npm run demo                # ⑤ replay the depeg → the breaker evacuates via Uniswap v3
```

## 🧪 Tests

**29 unit tests** covering the core logic (model, slippage, τ* selection, execution):

```bash
# Quant (Python) — 21 tests: sigmoid, v3 price, Noisy-OR, slippage, τ*, funds saved
cd quant-backtest && pip install -r requirements-dev.txt && python -m pytest

# Execution (TS) — 8 tests: position conversion, slippage bps, minOut, feed parsing
cd live-execution && npm test
```

**Full-stack E2E** — chains the entire pipeline (data → CBRI → backtest τ* → 0G anchoring → Uniswap evacuation) and verifies every step (14 checks):

```bash
./e2e.sh          # 🟢 Full chain operational — dress rehearsal before the demo
```

Plus 7 **quant e2e** tests on real data (`pytest -m e2e`) validating the pitch numbers (τ*=66, ~$127k saved, bottom $0.8726).

---

*Hackathon MVP — public architecture assumed (no privacy/MEV layer in this scope).*
