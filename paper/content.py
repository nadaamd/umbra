"""
Contenu du papier Umbra (CBRI) — source unique consommée par les deux rendus
(build_paper.py -> .docx  et  build_pdf.py -> .pdf).

Aussi : rendu des équations LaTeX en PNG (partagé), via matplotlib mathtext.
"""
import os
import struct
import tempfile

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
FIG_DIR = os.path.join(HERE, "..", "quant-backtest", "output")
EQ_DIR = tempfile.mkdtemp(prefix="umbra_eq_")
EQ_DPI = 220


def png_size(path):
    with open(path, "rb") as f:
        f.read(16)
        w, h = struct.unpack(">II", f.read(8))
    return w, h


def eq(latex, size=15):
    """Rend une équation LaTeX (mathtext) en PNG et renvoie son chemin."""
    for a, b in [("\\big(", "\\left("), ("\\big)", "\\right)"),
                 ("\\Big(", "\\left("), ("\\Big)", "\\right)"),
                 ("\\big[", "\\left["), ("\\big]", "\\right]"),
                 ("\\Big[", "\\left["), ("\\Big]", "\\right]"),
                 ("\\!", ""), ("\\qquad", "\\ \\ "), ("\\quad", "\\ \\ "),
                 ("\\;", "\\,"), ("\\:", "\\,"), ("\\min", "\\mathrm{min}")]:
        latex = latex.replace(a, b)
    path = os.path.join(EQ_DIR, f"eq_{abs(hash(latex))}.png")
    fig = plt.figure(figsize=(0.01, 0.01))
    fig.text(0.5, 0.5, f"${latex}$", ha="center", va="center", fontsize=size, color="#141414")
    fig.savefig(path, dpi=EQ_DPI, bbox_inches="tight", pad_inches=0.06, transparent=True)
    plt.close(fig)
    return path


META = {
    "title1": "Umbra — A Composite Break-Risk Index (CBRI)",
    "title2": "for Autonomous DeFi Circuit-Breaking",
    "subtitle": "A quantitative early-warning score that detects systemic pool stress "
                "and evacuates capital before liquidity evaporates.",
    "meta": "Umbra Research  ·  ETH Global Lisbon 2026  ·  github.com/nadaamd/umbra",
}

ABSTRACT = (
    "DeFi liquidity pools fail fast: when a stablecoin de-pegs or liquidity flees, the "
    "price dislocates and exit costs explode within minutes, well before the average "
    "holder can react. We introduce the Composite Break-Risk Index (CBRI), a continuous "
    "0–100 score that fuses three on-chain signals — the velocity of liquidity "
    "withdrawal, order-flow imbalance, and peg divergence — into a single risk reading. "
    "Each signal is squashed by a logistic function into a comparable [0,1] probability, "
    "then combined through a weighted Noisy-OR aggregator that behaves like a physical "
    "circuit breaker: the score trips if any single signal turns red, while "
    "non-informative signals are neutralised by a zero weight. We then derive the "
    "optimal trigger threshold τ* by maximising slippage-aware funds saved on real "
    "historical crashes. Back-tested on the March 2023 USDC de-peg (48,066 Uniswap v3 "
    "swaps, $5.57B volume), Umbra fires at τ*=66 seventeen hours before the trough — "
    "while USDC still trades at $1.0000 — preserving $126,900 (12.7%) on a $1M position."
)

# Chaque bloc : (type, *args)
BLOCKS = [
    ("h1", "1. The problem: DeFi breaks faster than people react"),
    ("body",
     "A liquidity pool is a shared reserve of two assets that traders swap against. It "
     "works beautifully until confidence cracks. When holders rush to exit an asset — "
     "because a stablecoin looks unsafe, or a large lender is unwinding — two things "
     "happen at once: the price of the fleeing asset falls, and the depth of the pool "
     "(how much you can sell without moving the price) collapses. The result is a "
     "vicious spiral. By the time a retail user understands what is happening, the "
     "liquidity that would have let them exit cheaply is gone, and their sell order "
     "eats a punishing slippage on top of an already-fallen price."),
    ("body",
     "This is not hypothetical. The 2022–2023 cycle alone produced the Terra/UST "
     "collapse, the stETH discount, and the March 2023 USDC de-peg — each erasing "
     "hundreds of millions to tens of billions of dollars of value, much of it from "
     "users who simply reacted too late. The tooling gap is stark: markets have had "
     "circuit breakers for decades, yet DeFi positions have none."),
    ("callout", "In plain terms —",
     "Umbra is a smoke detector wired to a sprinkler. It watches the pool continuously, "
     "scores how close it is to breaking, and — past a proven threshold — automatically "
     "moves the user's funds to safety before the fire spreads."),

    ("h1", "2. What a good risk score must do"),
    ("body",
     "Before any mathematics, we fixed three design principles that a credible "
     "break-risk score must satisfy:"),
    ("bullet", "Early, not coincident.",
     "The score must rise on the causes of a break (liquidity leaving, one-sided flow) "
     "— which appear first — not merely on the symptom (a price that has already fallen)."),
    ("bullet", "Trip on any single failure.",
     "A pool can break through one channel alone. A score that averages its inputs "
     "dilutes a single extreme signal; a circuit breaker must not."),
    ("bullet", "Calm must read calm.",
     "In a healthy market the score must sit near zero. A detector that cries wolf is "
     "worse than none — every false trigger costs the user real slippage."),

    ("h1", "3. The three signals"),
    ("body",
     "Umbra reads three orthogonal on-chain quantities, each capturing a distinct way a "
     "pool tells you it is under stress. All are computed on 5-minute candles aggregated "
     "from raw swap, mint and burn events fetched via The Graph."),

    ("h2", "3.1  Liquidity-drain velocity — the early warning"),
    ("body",
     "The single earliest tell of a crisis is not the price; it is liquidity providers "
     "pulling their capital out, and doing so ever faster. We measure the relative rate "
     "at which the pool's value is draining:"),
    ("eq", r"v_L = -\,\frac{1}{L_t}\,\frac{\Delta L}{\Delta t}"),
    ("body",
     "Here L is the pool's liquidity (total value locked) and ΔL/Δt its change per unit "
     "time. Dividing by L makes the signal scale-free: a 5%/hour drain means the same "
     "thing for a $1M pool and a $1B pool. We compute ΔL from the net of mint (liquidity "
     "added) and burn (liquidity removed) events over a 45-minute window, which smooths "
     "single-LP noise while remaining fast."),
    ("callout", "Why it leads —",
     "Sophisticated liquidity providers de-risk first. Their exit thins the book hours "
     "before the crowd notices, so a rising v_L is a genuine head start."),

    ("h2", "3.2  Order-flow imbalance — the rush to the exit"),
    ("body",
     "In a panic, trading becomes one-directional: everyone sells the same asset. We "
     "quantify how lopsided the flow is:"),
    ("eq", r"I = \frac{\left|\,\sum \mathrm{in} - \sum \mathrm{out}\,\right|}"
           r"{\sum \left|\,\mathrm{flow}\,\right|}"),
    ("body",
     "I lives in [0,1]: it is 0 when buys and sells balance, and approaches 1 when flow "
     "is entirely one-way. Because Uniswap v3 has no static reserves, this realized "
     "order-flow imbalance is a more faithful stress measure for concentrated liquidity "
     "than any reserve-ratio proxy."),

    ("h2", "3.3  Peg divergence — the confirmation"),
    ("body",
     "For a stablecoin, the most direct evidence of a break is the price itself leaving "
     "its peg. We read the price straight from the deepest stable/stable pool "
     "(USDC/USDT), which needs no external oracle:"),
    ("eq", r"D = \left|\,1 - P_{\mathrm{USDC}}\,\right|"),
    ("body",
     "D is the fraction by which the coin has left $1. It is a confirming signal — large "
     "and unambiguous once a de-peg is underway — that complements the forward-looking "
     "drain and flow signals."),

    ("h1", "4. From three signals to one 0–100 score"),
    ("h2", "4.1  Normalization: making signals comparable"),
    ("body",
     "The three raw quantities live on incompatible scales (a fraction per hour, a ratio, "
     "a price deviation). We map each onto a common [0,1] axis with a logistic (sigmoid) "
     "function, which acts as a soft, tunable threshold:"),
    ("eq", r"s_i = \sigma\left(\alpha_i\,(x_i-\theta_i)\right),\ \ "
           r"\sigma(z)=\frac{1}{1+e^{-z}}"),
    ("body",
     "θ_i is the level at which the signal starts to look abnormal, and α_i sets how "
     "sharply the transition happens. Below its threshold a signal contributes ≈0; well "
     "above it, ≈1. Each s_i can be read as “the probability, according to this one "
     "lens, that the pool is breaking.”"),

    ("h2", "4.2  Aggregation: the circuit-breaker logic (Noisy-OR)"),
    ("body",
     "We do not average the signals — averaging would let a single extreme reading be "
     "diluted by two calm ones, exactly the wrong behaviour for a breaker. Instead we "
     "combine them with a weighted Noisy-OR:"),
    ("eq", r"\mathrm{CBRI} = 100\left(1-\prod_i \left(1-w_i\,s_i\right)\right)"),
    ("body",
     "Read literally, the product is the probability that the pool survives every signal "
     "at once; one minus that is the probability it breaks through at least one channel. "
     "The consequence is precisely the circuit-breaker property: if any single s_i "
     "approaches 1, the whole score is driven to 100, regardless of the others. The "
     "weights w_i are a safety valve — a signal that carries no information on a given "
     "regime is set to w=0 and cleanly removed, without re-deriving the model."),
    ("callout", "A useful discovery —",
     "On the USDC de-peg, order-flow imbalance turned out to be non-discriminating "
     "(arbitrageurs kept buying the cheap coin, so flow never became fully one-way). "
     "Rather than let it add noise, we set its weight to zero. The CBRI here is "
     "effectively a two-signal breaker — drain OR de-peg:"),
    ("eq", r"\mathrm{CBRI} = 100\left(1-(1-s_{\mathrm{drain}})\,"
           r"(1-s_{\mathrm{depeg}})\right)"),

    ("h1", "5. Calibration: calm reads ~8, crisis reads 100"),
    ("body",
     "The thresholds θ_i and steepnesses α_i are not guessed; they are set so that each "
     "sigmoid rests near zero in normal conditions and saturates only in genuine stress, "
     "then validated against the data. With the parameters below, the CBRI sits at a "
     "resting baseline of roughly 7–10 during calm trading and rises to 100 at the "
     "height of the crisis — a clean separation with no false alarms in the quiet window."),
    ("table",
     ["Signal", "Threshold θ", "Steepness α", "Window", "Weight w"],
     [["Liquidity-drain velocity v_L", "0.06 /h", "60", "45 min", "1.0"],
      ["Order-flow imbalance I", "0.30", "15", "30 min", "0.0 (off)"],
      ["Peg divergence D", "0.012", "250", "—", "1.0"]],
     "Table 1 — CBRI model parameters (5-minute candles)."),

    ("h1", "6. From score to action: the optimal trigger τ*"),
    ("body",
     "A score is only useful if it tells you when to act. Umbra evacuates the position — "
     "swapping the at-risk asset into a safe stablecoin — the first time the CBRI crosses "
     "a threshold τ. Choosing τ well is itself a quantitative problem."),
    ("h2", "6.1  The false-recovery trap"),
    ("body",
     "USDC eventually recovered to ~$1.00. Measured naïvely against the trough, "
     "evacuating always looks good and earlier is always better; measured against the "
     "full recovery, it looks pointless. Both framings are misleading. The honest "
     "objective treats evacuation as downside protection whose real cost is the slippage "
     "paid to get out — and that slippage is the crux."),
    ("h2", "6.2  Slippage-aware funds saved"),
    ("body",
     "As liquidity collapses, the cost of exiting a fixed $1M position explodes. We model "
     "exit slippage as inversely related to the pool's surviving depth, anchored to a "
     "live Uniswap quote in calm conditions:"),
    ("eq", r"\mathrm{slip}(t) = \min\left(\mathrm{CAP},\ "
           r"s_{\mathrm{calm}}\,(L_{\mathrm{ref}}/L_t)^{\beta}\right)"),
    ("body",
     "The funds saved by triggering at threshold τ are then the value recovered at the "
     "exit — net of that slippage — versus suffering the trough:"),
    ("eq", r"\mathrm{FundsSaved}(\tau) = P\cdot P_{\mathrm{exit}}(\tau)\,"
           r"\left(1-\mathrm{slip}(\tau)\right) - P\cdot P_{\mathrm{trough}}"),
    ("body", "and the optimal trigger maximises this in expectation:"),
    ("eq", r"\tau^{*} = \mathrm{arg\,max}_{\tau}\ \ "
           r"\mathrm{E}\left[\mathrm{FundsSaved}(\tau)\right]"),
    ("h2", "6.3  The plateau and the chosen threshold"),
    ("body",
     "Because the CBRI leaps from its resting baseline straight past 60 the moment "
     "liquidity flight begins, every threshold up to that jump triggers at the same "
     "optimal instant — a plateau of equally-good choices. We select the highest "
     "threshold on that plateau, τ*=66, which captures the full protection while leaving "
     "the maximum safety margin against false alarms."),

    ("h1", "7. Empirical validation — the March 2023 USDC de-peg"),
    ("body",
     "We replay the SVB-driven USDC de-peg of 10–13 March 2023 on real data: 48,066 "
     "Uniswap v3 swaps totalling $5.57B of volume, cross-referenced with the USDC/USDT "
     "pool for the peg and with mint/burn events for the liquidity drain. The evacuated "
     "position is $1M of USDC."),
    ("figure", "fig1_cbri_vs_price.png",
     "Figure 1 — The CBRI (red) against the USDC price (black). The breaker fires at "
     "τ*=66 on 10 March 14:10 UTC, while USDC is still $1.0000 — about 17 hours before "
     "the $0.8726 trough."),
    ("body",
     "The active liquidity of the USDC/USDT pool collapsed by a factor of roughly 23 "
     "million as the price left the concentrated range — the physical reason exit "
     "slippage explodes if one waits. The table below shows the cost of hesitation: each "
     "block of thresholds triggers later, at a worse price and a worse slippage."),
    ("table",
     ["Trigger τ", "Exit time (UTC)", "Exit price", "Slippage", "Funds saved"],
     [["10–66  (τ*)", "10 Mar 14:10", "$1.0000", "5 bps", "$126,900"],
      ["67–72", "11 Mar 00:15", "$0.9892", "53 bps", "$111,400"],
      ["73–98", "11 Mar 01:00", "$0.9726", "91 bps", "$91,100"],
      ["99", "11 Mar 03:00", "$0.9371", "657 bps", "$2,900"]],
     "Table 2 — Waiting is expensive: funds saved by trigger threshold, $1M position."),
    ("figure", "fig2_funds_saved_vs_tau.png",
     "Figure 2 — Funds saved as a function of the trigger threshold τ. The flat plateau "
     "(τ ≤ 66) is the zero-false-positive optimum; beyond it, every step of waiting "
     "forfeits capital."),
    ("figure", "fig3_slippage_explosion.png",
     "Figure 3 — Exit slippage over time versus the calm Uniswap anchor. Exiting at τ* "
     "costs a few basis points; waiting for price confirmation means hitting a liquidity "
     "wall."),
    ("body",
     "Headline result: triggering at τ*=66 evacuates the position at $1.0000 for a "
     "5-basis-point cost, preserving $126,900 — 12.7% of the position — that a passive "
     "holder would have watched evaporate into the trough."),

    ("h1", "8. Economic alignment"),
    ("body",
     "Umbra charges a success fee only on the loss it avoids. On the case above, a 10% "
     "fee is $12,690 of revenue — earned strictly because the user kept $126,900 they "
     "would otherwise have lost. Incentives are exactly aligned: Umbra is paid if and "
     "only if the user is protected. Every score and the exact model that produced it "
     "are anchored on 0G decentralized storage, so the scoring is auditable and "
     "tamper-evident rather than a black box."),

    ("h1", "9. Limitations and future work"),
    ("bullet", "Single-venue execution.",
     "The MVP routes the evacuation through one pool — the very pool whose depth "
     "collapses in a crisis. Production execution must split across pools, fee tiers and "
     "venues (multi-hop routing) to avoid the slippage wall it warns about."),
    ("bullet", "Signal set.",
     "Order-flow imbalance was non-informative on this crash and disabled. A "
     "volatility-surge or cross-pool contagion signal is a natural third pillar for a "
     "broader regime library."),
    ("bullet", "Recovery uncertainty.",
     "The τ* objective is honest downside protection; a fuller treatment weights "
     "terminal-collapse (UST-like) against false-alarm (USDC-like) scenarios under an "
     "explicit crisis probability."),
    ("bullet", "Real-time pipeline.",
     "The current system replays history for validation; a production loop streams The "
     "Graph continuously and pushes scores on-chain in real time."),

    ("h1", "Appendix — Data and reproducibility"),
    ("body",
     "Data source: The Graph (Uniswap v3 Ethereum mainnet subgraph). Pools: USDC/WETH "
     "0.05% (0x88e6…5640) for drain and flow; USDC/USDT 0.01% (0x3416…27c6) for the peg. "
     "Window: 10–13 March 2023 UTC. Execution venue: Uniswap v3 (QuoterV2 + "
     "SwapRouter02). The full pipeline — extraction, CBRI computation, τ* back-test, and "
     "29 unit/end-to-end tests — is reproducible from the repository via a single script "
     "(./e2e.sh)."),
    ("footer", "Umbra · CBRI v1.0 · Composite Break-Risk Index · ETH Global Lisbon 2026"),
]
