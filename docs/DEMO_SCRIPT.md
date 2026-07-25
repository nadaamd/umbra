# 🌒 Umbra — Live Demo Script

**ETH Global Lisbon 2026 · ~4–5 minutes · one operator + one narrator (or solo)**

> Goal: prove — on real data, live — that Umbra detects a crisis *hours early* and evacuates a $1M position before the liquidity wall. Every step lands one sponsor.

---

## 0 · Pre-demo checklist (do this before you're on stage)

- [ ] Terminal open at repo root, Python venv active: `cd quant-backtest && source .venv/bin/activate && cd ..`
- [ ] `.env` has `THEGRAPH_API_KEY` set
- [ ] **Warm the run once**: `./e2e.sh` → must print `🟢 Full chain operational` (this also caches The Graph data so the live demo is instant and network-independent)
- [ ] Slides open (`paper/Umbra_Slides.pdf`) and paper ready (`paper/Umbra_CBRI_Paper.pdf`)
- [ ] (Optional) Frontend running: `cd frontend && npm run dev` → the Umbra terminal
- [ ] Font size up in the terminal; dark theme (matches the deck)

**Golden rule:** the data is already fetched, so nothing depends on conference Wi-Fi. If any live call fails, the modeled fallback still shows the number — keep going.

---

## 1 · The hook — 15s (Slide 1–2)

> *"Every cycle, DeFi users lose billions in depegs and liquidity crises — not because the risk is invisible, but because they react too late. Markets have had circuit breakers for a century. DeFi positions have none. We built one."*

Show the title slide, then the problem slide. Don't linger.

---

## 2 · The score — The Graph 🏆 (~45s)

> *"Umbra reads the pool live. Here it is scoring the real USDC depeg of March 2023 — every 5-minute candle rebuilt from **48,066 real Uniswap v3 swaps we pulled through The Graph**."*

```bash
cd quant-backtest && python features.py
```

Point at the output:
- `USDC min : 0.8726` → *"the coin really bottomed at 87 cents"*
- `CBRI max : 100` → *"our risk index saturates at the crisis"*

> **Sponsor beat — The Graph:** *"No node, no archive infra — The Graph gave us tick-level swaps, mints and burns across two pools in seconds. It's the data backbone."*

---

## 3 · The proof — the money slide (~60s, Slide 8–9)

> *"The question a judge should ask is: at what score do you pull the trigger? We don't guess — we optimize it."*

```bash
python backtest.py
```

Read the result box out loud:
- `τ* optimal : 66` · `Trigger : 10/03 14:10` · `Exit : $1.0000`
- **`FUNDS SAVED : $126,900 (12.7%)`**

> *"Umbra fires seventeen hours before the bottom — while USDC is still worth a dollar — and saves $126,900 on a $1M position. Waiting for the price to confirm would have cost you a hundred grand and a 6% slippage wall."*

Flip to the **funds-saved vs τ** slide: *"every point of risk you wait forfeits money — that's the whole thesis in one curve."*

---

## 4 · Traceability — 0G 🏆 (~40s)

> *"A circuit breaker you have to trust blindly is worthless. So the exact model and every score are frozen and anchored on **0G decentralized storage**."*

```bash
cd ../live-execution && npm run publish0g
```

Point at:
- `🌳 0G Storage root hash : 0x…` → *"this hash is the fingerprint of the model + all 864 scores. Anyone can re-download the artifact and verify it — the scoring is auditable, tamper-evident, not a black box."*

> **Sponsor beat — 0G:** *"0G is where our AI risk model lives on-chain. Decentralized, verifiable AI infra — exactly its purpose."*

---

## 5 · The action — Uniswap execution (~50s)

> *"Detection is nothing without execution. When the score crosses τ*, Umbra evacuates — for real, on-chain."*

```bash
npm run demo
```

Narrate the replay as the CBRI bar climbs:
- The gauge rises… `⚠️` … then:
- **`🛑 DISJONCTEUR DÉCLENCHÉ — CBRI = 66 ≥ τ* = 66`**
- `quote Uniswap : 1,000,699 USDT (LIVE on-chain, QuoterV2)`
- `▶️ Position à l'abri en USDT.`

> **Execution beat — Uniswap v3:** *"The exit is a direct on-chain swap — a live QuoterV2 read then SwapRouter02, no external API, priced at the pool's real depth. In production it routes multi-venue; tonight it's the real quote, right now."*

*(Safety note you can drop if a judge asks: in LIVE mode we refuse to send a swap if the quote fails — no execution without slippage protection.)*

---

## 6 · (Optional) The terminal — 20s

> *"And this is the operator's view."* — switch to the frontend: the live CBRI gauge, the eclipse breaker, the evacuation log. Let it breathe for 5 seconds. Design sells.

---

## 7 · The close — 30s (Slide: business model)

> *"The business model is the cleanest part: a success fee only on the loss we avoid. On this event, 10% is $12,690 — earned only because the user kept $126,900. We win if and only if they do."*

> *"Umbra: The Graph for the data, 0G for verifiable AI, Uniswap for execution — a working, tested, on-chain circuit breaker for DeFi. Thank you."*

---

## 🎯 Sponsor cheat-sheet (say the name, say the value)

| Sponsor | One-liner to land |
|---|---|
| **The Graph** | *"Tick-level swaps/mints/burns across pools in seconds — our entire data backbone."* |
| **0G** | *"Our AI risk model and every score anchored on decentralized, verifiable storage."* |
| **Uniswap v3** | *"Live on-chain quote + swap for the evacuation — real depth, no API."* |

## ⏱️ Timing

| Segment | Time |
|---|---|
| Hook | 0:15 |
| Score (The Graph) | 0:45 |
| Proof / τ* | 1:00 |
| Traceability (0G) | 0:40 |
| Execution (Uniswap) | 0:50 |
| Terminal (optional) | 0:20 |
| Close | 0:30 |
| **Total** | **~4:20** |

## 🛟 Fallbacks

- **RPC down / no network:** `npm run demo` prints `USDT (modélisé)` instead of the live quote — the trigger and the saved-funds story are unchanged. Say *"live quote's on a public RPC; here's the modeled exit."*
- **Anything hangs:** you already ran `./e2e.sh` — show its `14 ✓ / 0 ✗` output and the `paper/` figures instead.
- **No terminal at all:** walk the slides + the paper. Numbers are the same everywhere.

## 🗣️ Q&A ammo

- *"Isn't τ* overfit?"* → It's the top of a **plateau [10–66]** with **zero false positives** in the calm window — robust, not a point pick.
- *"USDC recovered — so what?"* → We optimize **downside protection net of slippage**, the case that matters for a *terminal* break (UST). And exiting early costs 5 bps vs a 657 bps wall.
- *"Why not average the signals?"* → A breaker must trip on **any** single failure — that's the Noisy-OR, not a mean.
