"""
Umbra — pitch slide deck (math-focused), 16:9 PDF.
Design direction mirrors the frontend "Institutional Terminal" tokens:
dark Midnight-Violet base, eclipse palette (grape / mauve / ash-grey corona),
monospace typography, the eclipse crescent motif. Red reserved for crisis.

Output: paper/Umbra_Slides.pdf
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.colors as mcolors

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Umbra_Slides.pdf")
DATA = os.path.join(HERE, "..", "quant-backtest", "output")

# ── Palette (from tailwind.config.ts) ────────────────────────
BG, BG2 = "#2f2235", "#271b2d"
PANEL, PANEL2, RAISED = "#3f3244", "#372a3d", "#4a3b52"
LINE, LINE2 = "#493c50", "#60495a"
INK, INK2, INK3, INK4 = "#bfc3ba", "#a9aca9", "#837e88", "#5e5266"
MAUVE, GRID = "#60495a", "#3a2c43"
CRISIS = "#c9515b"          # red — reserved for crisis, softened for the muted deck
S1, S2, S3 = "#a9aca9", "#60495a", "#837e88"

MONO, SANS = "monospace", "sans-serif"
plt.rcParams["font.monospace"] = ["DejaVu Sans Mono"]
plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]

pdf = PdfPages(OUT)
_num = [0]


def lerp(c1, c2, t):
    a, b = np.array(mcolors.to_rgb(c1)), np.array(mcolors.to_rgb(c2))
    return tuple(a + (b - a) * t)


def eclipse(ax, cx, cy, r, tone=INK, bg=BG, corona=True):
    """The Umbra mark: a lit disc occluded into a crescent, with a corona ring."""
    ax.add_patch(Circle((cx, cy), r, color=tone, zorder=5))
    ax.add_patch(Circle((cx + 0.36 * r, cy + 0.30 * r), r * 0.94, color=bg, zorder=6))
    if corona:
        ax.add_patch(Circle((cx, cy), r * 1.16, fill=False, ec=tone, lw=1.1,
                            alpha=0.85, zorder=4))


def spaced(s):
    return " ".join(s.upper())


def slide(kicker=None):
    _num[0] += 1
    fig = plt.figure(figsize=(13.333, 7.5), dpi=150)
    fig.patch.set_facecolor(BG)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis("off")
    ax.add_patch(Rectangle((0, 0), 16, 9, color=BG, zorder=0))
    # faint corona wash, top-right
    for i, rr in enumerate(np.linspace(6, 2, 6)):
        ax.add_patch(Circle((15.2, 8.2), rr, fill=False, ec=INK4,
                            lw=0.6, alpha=0.05 + i * 0.01, zorder=0))
    # footer
    ax.plot([0.9, 15.1], [0.62, 0.62], color=LINE, lw=0.8, zorder=1)
    ax.text(0.9, 0.36, spaced("UMBRA · CBRI"), color=INK3, fontsize=7.5,
            family=MONO, va="center")
    ax.text(15.1, 0.36, f"{_num[0]:02d}", color=INK3, fontsize=7.5,
            family=MONO, va="center", ha="right")
    eclipse(ax, 8, 0.37, 0.11, tone=INK3)
    if kicker:
        ax.text(0.9, 8.35, spaced(kicker), color=INK3, fontsize=10.5,
                family=MONO, va="center")
        ax.plot([0.9, 2.1], [8.05, 8.05], color=MAUVE, lw=2, zorder=2)
    return fig, ax


_QA = os.environ.get("SLIDE_QA")   # si défini : exporte aussi chaque slide en PNG pour QA visuelle


def save(fig):
    pdf.savefig(fig, facecolor=BG)
    if _QA:
        fig.savefig(os.path.join(_QA, f"slide_{_num[0]:02d}.png"), facecolor=BG, dpi=110)
    plt.close(fig)


def panel(ax, x, y, w, h, fc=PANEL, ec=LINE):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08",
                                fc=fc, ec=ec, lw=1, zorder=2))


# ══════════════════════════════════════════════════════════════
# 1 · TITLE
# ══════════════════════════════════════════════════════════════
fig, ax = slide()
eclipse(ax, 3.4, 5.4, 1.15, tone=INK)
ax.text(5.4, 5.95, "UMBRA", color=INK, fontsize=58, family=MONO, fontweight="bold", va="center")
ax.text(5.5, 4.75, "The autonomous circuit breaker for DeFi", color=INK2, fontsize=17,
        family=SANS, va="center")
ax.text(5.5, 3.95, "Detect systemic pool stress — and evacuate capital before liquidity evaporates.",
        color=INK3, fontsize=12, family=SANS, va="center")
ax.text(0.9, 2.15, spaced("Composite Break-Risk Index  ·  CBRI v1.0"), color=INK3,
        fontsize=10, family=MONO)
ax.text(0.9, 1.55, "ETH Global Lisbon 2026   ·   github.com/nadaamd/umbra", color=INK4,
        fontsize=10.5, family=MONO)
save(fig)

# ══════════════════════════════════════════════════════════════
# 2 · THE PROBLEM
# ══════════════════════════════════════════════════════════════
fig, ax = slide("The problem")
ax.text(0.9, 6.6, "DeFi breaks faster", color=INK, fontsize=40, family=SANS, fontweight="bold", va="center")
ax.text(0.9, 5.55, "than people react.", color=INK, fontsize=40, family=SANS, fontweight="bold", va="center")
ax.text(0.9, 4.2, "When a pool goes into crisis, price falls and depth collapses at once.",
        color=INK2, fontsize=14, family=SANS)
ax.text(0.9, 3.6, "By the time you understand what's happening, the liquidity that would",
        color=INK2, fontsize=14, family=SANS)
ax.text(0.9, 3.05, "have let you exit cheaply is gone — and your sell order eats the wall.",
        color=INK2, fontsize=14, family=SANS)
for i, (a, b) in enumerate([("$60B+", "Terra / UST"), ("~$0.87", "USDC depeg low"),
                            ("billions", "lost — mostly to late reactions")]):
    x = 0.9 + i * 4.9
    panel(ax, x, 1.15, 4.4, 1.5)
    ax.text(x + 0.35, 2.15, a, color=INK, fontsize=24, family=MONO, fontweight="bold", va="center")
    ax.text(x + 0.35, 1.55, b, color=INK3, fontsize=11, family=SANS, va="center")
save(fig)

# ══════════════════════════════════════════════════════════════
# 3 · THE IDEA — one score, one trigger
# ══════════════════════════════════════════════════════════════
fig, ax = slide("The idea")
ax.text(0.9, 6.9, "One score.  0 → 100.  One trigger.", color=INK, fontsize=30,
        family=SANS, fontweight="bold", va="center")
# gauge
gx, gy, gw, gh = 0.9, 4.3, 14.2, 0.9
n = 240
for i in range(n):
    t = i / (n - 1)
    col = lerp(INK2, CRISIS, t ** 1.4)
    ax.add_patch(Rectangle((gx + gw * t, gy), gw / n + 0.01, gh, color=col, lw=0, zorder=2))
ax.add_patch(FancyBboxPatch((gx, gy), gw, gh, boxstyle="round,pad=0,rounding_size=0.1",
                            fill=False, ec=LINE2, lw=1.2, zorder=3))
# tau* marker at 66%
tx = gx + gw * 0.66
ax.plot([tx, tx], [gy - 0.25, gy + gh + 0.25], color=INK, lw=2, zorder=4)
ax.text(tx, gy + gh + 0.55, r"$\tau^{*}=66$", color=INK, fontsize=15, family=MONO,
        ha="center", fontweight="bold")
ax.text(gx, gy - 0.55, spaced("SAFE"), color=INK2, fontsize=10, family=MONO)
ax.text(gx + gw, gy - 0.55, spaced("EVACUATE"), color=CRISIS, fontsize=10, family=MONO, ha="right")
ax.text(0.9, 2.9, "CBRI is a continuous break-risk score, updated every 5 minutes.",
        color=INK2, fontsize=14, family=SANS)
ax.text(0.9, 2.3, "Cross the proven threshold  τ*  →  Umbra auto-evacuates the position to a safe stablecoin.",
        color=INK2, fontsize=14, family=SANS)
save(fig)

# ══════════════════════════════════════════════════════════════
# 4 · THREE SIGNALS
# ══════════════════════════════════════════════════════════════
fig, ax = slide("The model · inputs")
ax.text(0.9, 7.0, "Three orthogonal tells", color=INK, fontsize=28, family=SANS,
        fontweight="bold", va="center")
cards = [
    ("01", "Liquidity-drain velocity", r"$v_L=-\frac{1}{L}\,\frac{\Delta L}{\Delta t}$",
     "LPs pulling out — and\naccelerating. Leads by hours.", "EARLY WARNING", INK),
    ("02", "Order-flow imbalance", r"$I=\frac{|\sum\mathrm{in}-\sum\mathrm{out}|}{\sum|\mathrm{flow}|}$",
     "How one-directional the\nflow is. The rush to exit.", "THE RUSH", INK2),
    ("03", "Peg divergence", r"$D=\left|\,1-P\,\right|$",
     "The price itself leaving\nits $1 peg. Unambiguous.", "CONFIRMATION", INK2),
]
for i, (idx, name, formula, gloss, tag, tone) in enumerate(cards):
    x = 0.9 + i * 4.85
    panel(ax, x, 1.15, 4.45, 5.2)
    ax.text(x + 0.35, 5.85, idx, color=INK4, fontsize=13, family=MONO, va="center")
    ax.text(x + 0.35, 4.9, name, color=INK, fontsize=15, family=SANS, fontweight="bold", va="center")
    ax.text(x + 2.22, 3.75, formula, color=tone, fontsize=21, family=MONO, va="center", ha="center")
    for j, ln in enumerate(gloss.split("\n")):
        ax.text(x + 0.35, 2.7 - j * 0.45, ln, color=INK3, fontsize=11.5, family=SANS, va="center")
    ax.plot([x + 0.35, x + 4.1], [1.75, 1.75], color=LINE, lw=0.8)
    ax.text(x + 0.35, 1.45, spaced(tag), color=INK3, fontsize=8.5, family=MONO, va="center")
save(fig)

# ══════════════════════════════════════════════════════════════
# 5 · NORMALIZATION — the sigmoid
# ══════════════════════════════════════════════════════════════
fig, ax = slide("The model · normalize")
ax.text(0.9, 7.0, "A soft, tunable threshold", color=INK, fontsize=28, family=SANS,
        fontweight="bold", va="center")
# inset axes for the sigmoid
iax = fig.add_axes([0.09, 0.2, 0.42, 0.5])
iax.set_facecolor(PANEL2)
xs = np.linspace(-6, 6, 200)
ys = 1 / (1 + np.exp(-xs))
iax.plot(xs, ys, color=INK, lw=2.4)
iax.axvline(0, color=MAUVE, lw=1.2, ls="--")
iax.axhline(0.5, color=LINE2, lw=0.8, ls=":")
iax.text(0.2, 0.06, r"$\theta$", color=INK2, fontsize=14, family=MONO)
iax.set_xticks([]); iax.set_yticks([0, 1])
iax.set_yticklabels(["0", "1"], color=INK3, fontsize=10, family=MONO)
for s in iax.spines.values():
    s.set_color(LINE)
iax.tick_params(colors=INK3)
ax.text(8.4, 5.4, r"$s_i=\sigma\!\left(\alpha_i\,(x_i-\theta_i)\right)$", color=INK,
        fontsize=26, family=MONO, va="center")
ax.text(8.4, 4.3, "Each raw signal → a common [0,1] axis.", color=INK2, fontsize=14, family=SANS)
ax.text(8.4, 3.7, r"$\theta$  = where it starts to look abnormal.", color=INK3, fontsize=13, family=SANS)
ax.text(8.4, 3.15, r"$\alpha$  = how sharply it flips.", color=INK3, fontsize=13, family=SANS)
ax.text(8.4, 2.4, "Read it as: the probability, through this one lens,", color=INK2, fontsize=13, family=SANS)
ax.text(8.4, 1.9, "that the pool is breaking.", color=INK2, fontsize=13, family=SANS)
save(fig)

# ══════════════════════════════════════════════════════════════
# 6 · AGGREGATION — Noisy-OR
# ══════════════════════════════════════════════════════════════
fig, ax = slide("The model · aggregate")
ax.text(0.9, 7.0, "A breaker trips on ANY red", color=INK, fontsize=28, family=SANS,
        fontweight="bold", va="center")
# diagram: three signals -> OR -> 100
sy = [5.4, 4.35, 3.3]
labels = [(r"$s_\mathrm{drain}$", INK), (r"$s_\mathrm{flow}$", INK3), (r"$s_\mathrm{depeg}$", INK2)]
for (lab, tone), y in zip(labels, sy):
    ax.add_patch(Circle((1.6, y), 0.16, color=tone, zorder=4))
    ax.text(2.05, y, lab, color=tone, fontsize=15, family=MONO, va="center")
    ax.plot([3.0, 4.6], [y, 4.35], color=LINE2, lw=1.2, zorder=1)
panel(ax, 4.6, 3.85, 1.9, 1.0, fc=RAISED)
ax.text(5.55, 4.35, "OR", color=INK, fontsize=20, family=MONO, fontweight="bold", va="center", ha="center")
ax.plot([6.5, 7.6], [4.35, 4.35], color=LINE2, lw=1.2)
ax.text(8.4, 4.35, "CBRI", color=INK, fontsize=30, family=MONO, fontweight="bold", va="center")
ax.text(9.9, 4.35, "→ 100", color=CRISIS, fontsize=26, family=MONO, va="center")
ax.text(0.9, 2.4, r"$\mathrm{CBRI}=100\left(1-\prod_i(1-w_i\,s_i)\right)$", color=INK,
        fontsize=22, family=MONO, va="center")
ax.text(0.9, 1.45, "Not an average — one extreme signal is enough. Non-informative signals get weight 0 and vanish.",
        color=INK2, fontsize=13, family=SANS)
save(fig)

# ══════════════════════════════════════════════════════════════
# 7 · CALIBRATION
# ══════════════════════════════════════════════════════════════
fig, ax = slide("Calibration")
ax.text(0.9, 7.0, "Calm reads ~8.  Crisis reads 100.", color=INK, fontsize=28, family=SANS,
        fontweight="bold", va="center")
for i, (val, lab, tone) in enumerate([(8, "RESTING (calm market)", INK3),
                                      (100, "PEAK (crisis)", CRISIS)]):
    y = 5.2 - i * 1.7
    ax.text(0.9, y + 0.55, spaced(lab), color=INK3, fontsize=10, family=MONO)
    ax.add_patch(Rectangle((0.9, y - 0.35), 13.6, 0.7, color=PANEL2, zorder=2))
    ax.add_patch(Rectangle((0.9, y - 0.35), 13.6 * val / 100, 0.7,
                           color=lerp(INK2, CRISIS, (val / 100) ** 1.4), zorder=3))
    ax.text(0.9 + 13.6 * val / 100 + 0.2, y, str(val), color=INK, fontsize=16,
            family=MONO, va="center", fontweight="bold")
ax.text(0.9, 1.7, "Thresholds are set so each sigmoid rests near zero and saturates only in genuine stress —",
        color=INK2, fontsize=13, family=SANS)
ax.text(0.9, 1.2, "a clean separation with zero false alarms in the quiet window.", color=INK2,
        fontsize=13, family=SANS)
save(fig)

# ══════════════════════════════════════════════════════════════
# 8 · IN ACTION — CBRI vs price (dark redraw)
# ══════════════════════════════════════════════════════════════
df = pd.read_csv(os.path.join(DATA, "cbri_USDC_depeg_SVB_2023-03.csv"))
df["dt"] = pd.to_datetime(df["dt"], utc=True)
fig, ax = slide("Validation · USDC depeg, Mar 2023")
ax.text(0.9, 7.0, "17 hours of early warning", color=INK, fontsize=28, family=SANS,
        fontweight="bold", va="center")
iax = fig.add_axes([0.075, 0.13, 0.86, 0.52])
iax.set_facecolor(BG)
t = df["dt"]
iax.plot(t, df["usdc_usd"], color=INK, lw=1.8, label="USDC price")
iax.axhline(1.0, color=LINE2, lw=0.8, ls=":")
ax2 = iax.twinx()
ax2.fill_between(t, 0, df["cbri"], color=CRISIS, alpha=0.14)
ax2.plot(t, df["cbri"], color=CRISIS, lw=1.3, label="CBRI")
trig = pd.Timestamp("2023-03-10 14:10", tz="UTC")
iax.axvline(trig, color=INK, lw=2)
iax.annotate("EVACUATE @ $1.0000", xy=(trig, 0.965), color=INK, fontsize=10.5,
             family=MONO, fontweight="bold")
iax.annotate("bottom $0.8726", xy=(pd.Timestamp("2023-03-11 07:00", tz="UTC"), 0.876),
             color=INK3, fontsize=9.5, family=MONO)
for a in (iax, ax2):
    for s in a.spines.values():
        s.set_color(LINE)
    a.tick_params(colors=INK3, labelsize=8)
iax.set_ylim(0.84, 1.02)
ax2.set_ylim(0, 108)
iax.set_ylabel("USDC / USD", color=INK2, fontsize=10)
ax2.set_ylabel("CBRI", color=CRISIS, fontsize=10)
save(fig)

# ══════════════════════════════════════════════════════════════
# 9 · τ* — the money slide (dark redraw)
# ══════════════════════════════════════════════════════════════
sw = pd.read_csv(os.path.join(DATA, "backtest_tau_sweep.csv"))
fig, ax = slide("The optimal trigger τ*")
ax.text(0.9, 7.0, "$126,900 saved", color=INK, fontsize=34, family=SANS,
        fontweight="bold", va="center")
ax.text(6.3, 7.05, "on a $1M position — 12.7%", color=INK3, fontsize=14, family=SANS, va="center")
iax = fig.add_axes([0.075, 0.14, 0.60, 0.50])
iax.set_facecolor(BG)
iax.step(sw["tau"], sw["funds_saved"] / 1e3, where="post", color=INK, lw=2.2)
iax.axvline(66, color=CRISIS, lw=1.6, ls="--")
iax.scatter([66], [sw.loc[sw.tau == 66, "funds_saved"].iloc[0] / 1e3], color=CRISIS, s=45, zorder=5)
iax.annotate(r"$\tau^{*}=66$", xy=(66, 128), color=CRISIS, fontsize=13, family=MONO, ha="center")
for s in iax.spines.values():
    s.set_color(LINE)
iax.tick_params(colors=INK3, labelsize=9)
iax.set_xlabel("trigger threshold τ", color=INK2, fontsize=11)
iax.set_ylabel("funds saved ($k)", color=INK2, fontsize=11)
# side stats
sx = 11.3
for i, (a, b) in enumerate([("τ* = 66", "highest safe threshold"),
                            ("+$126.9k", "vs suffering the bottom"),
                            ("5 bps", "exit slippage at τ*"),
                            ("−$124k", "cost of waiting to τ=99")]):
    y = 5.6 - i * 1.05
    ax.text(sx, y, a, color=INK, fontsize=17, family=MONO, fontweight="bold", va="center")
    ax.text(sx, y - 0.42, b, color=INK3, fontsize=10, family=SANS, va="center")
save(fig)

# ══════════════════════════════════════════════════════════════
# 10 · SLIPPAGE PHYSICS
# ══════════════════════════════════════════════════════════════
fig, ax = slide("Why early = cheap")
ax.text(0.9, 7.0, "Liquidity vanishes  ×23,000,000", color=INK, fontsize=27, family=SANS,
        fontweight="bold", va="center")
ax.text(0.9, 5.8, "As USDC leaves the peg, the active depth of the USDC/USDT pool collapses",
        color=INK2, fontsize=14, family=SANS)
ax.text(0.9, 5.25, "by seven orders of magnitude — so a fixed $1M exit hits a wall.", color=INK2,
        fontsize=14, family=SANS)
pairs = [("5 bps", "exit at τ* — near free", INK, 0.05),
         ("657 bps", "exit at τ=99 — the wall", CRISIS, 1.0)]
for i, (big, lab, tone, frac) in enumerate(pairs):
    x = 0.9 + i * 7.3
    panel(ax, x, 1.5, 6.6, 2.6)
    ax.text(x + 0.5, 3.3, big, color=tone, fontsize=40, family=MONO, fontweight="bold", va="center")
    ax.text(x + 0.5, 2.2, lab, color=INK3, fontsize=13, family=SANS, va="center")
ax.annotate("", xy=(8.0, 2.8), xytext=(7.5, 2.8),
            arrowprops=dict(arrowstyle="-|>", color=INK2, lw=2))
save(fig)

# ══════════════════════════════════════════════════════════════
# 11 · SPONSORS / STACK
# ══════════════════════════════════════════════════════════════
fig, ax = slide("Built on")
ax.text(0.9, 7.0, "The stack", color=INK, fontsize=28, family=SANS, fontweight="bold", va="center")
rows = [
    ("The Graph", "DATA BACKBONE · TARGET TRACK",
     "Tick-level swaps, mints & burns across pools — 48,066 real events in seconds."),
    ("0G", "VERIFIABLE ON-CHAIN AI · TARGET TRACK",
     "The risk model + every score anchored on decentralized storage. Auditable, tamper-evident."),
    ("Uniswap v3", "EXECUTION · INFRA",
     "Live on-chain quote (QuoterV2) + swap (SwapRouter02) for the evacuation. Real depth, no API."),
]
for i, (name, tag, desc) in enumerate(rows):
    y = 5.6 - i * 1.75
    panel(ax, 0.9, y - 0.65, 14.2, 1.45)
    eclipse(ax, 1.75, y, 0.34, tone=INK)
    ax.text(2.7, y + 0.32, name, color=INK, fontsize=20, family=SANS, fontweight="bold", va="center")
    ax.text(2.7, y - 0.32, desc, color=INK3, fontsize=12, family=SANS, va="center")
    ax.text(14.7, y + 0.34, tag, color=INK2, fontsize=9.5, family=MONO, va="center", ha="right")
save(fig)

# ══════════════════════════════════════════════════════════════
# 12 · CLOSE — business model
# ══════════════════════════════════════════════════════════════
fig, ax = slide("Business model")
eclipse(ax, 13.6, 6.4, 0.9, tone=INK)
ax.text(0.9, 6.2, "We earn only on the", color=INK, fontsize=38, family=SANS, fontweight="bold", va="center")
ax.text(0.9, 5.15, "loss we avoid.", color=INK, fontsize=38, family=SANS, fontweight="bold", va="center")
ax.text(0.9, 3.9, "A success fee charged only on funds saved.", color=INK2, fontsize=16, family=SANS)
ax.text(0.9, 3.3, "On this event: 10% = $12,690 — earned only because the user kept $126,900.",
        color=INK2, fontsize=16, family=SANS)
ax.text(0.9, 2.55, spaced("We win if and only if the user wins."), color=INK, fontsize=13, family=MONO)
ax.plot([0.9, 15.1], [2.05, 2.05], color=LINE, lw=0.8)
ax.text(0.9, 1.5, "The Graph  ·  0G  ·  Uniswap v3        A working, tested, on-chain circuit breaker for DeFi.",
        color=INK3, fontsize=12, family=MONO)
save(fig)

pdf.close()
print(f"✅ Slides générées : {OUT}  ({_num[0]} slides, 16:9)")
