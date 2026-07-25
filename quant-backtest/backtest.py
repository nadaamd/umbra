"""
Backtest CircuitBreaker.ai — trouve le seuil de déclenchement optimal τ*.

Objectif (Option 1, slippage-aware) : pour un utilisateur détenant $1M USDC,
on évacue vers USDT à la première bougie où CBRI ≥ τ. L'exécution se fait au
prix de l'USDC de l'instant, NET du slippage réel (modèle v3 sur la liquidité
historique qui s'effondre, ancre calme validée live via Uniswap QuoterV2).

    Fonds_sauvés(τ) = Valeur_évacuée(τ) − Valeur_pire_cas
    Valeur_évacuée(τ) = POSITION · P_exit(τ) · (1 − slippage(τ))
    Valeur_pire_cas   = POSITION · P_trough            (subir le fond du depeg)

τ* = τ qui maximise les fonds sauvés SANS déclencher de faux positif en marché
calme (USDC encore au peg). Économiquement : le seuil le plus précoce qui reste
fiable. On prélève un success fee sur les fonds sauvés.
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import config
import slippage


def load_panel() -> pd.DataFrame:
    """Features CBRI + liquidité active de la pool USDC/USDT (pour le slippage)."""
    df = pd.read_csv(config.FEATURES_CSV)
    df["dt"] = pd.to_datetime(df["dt"], utc=True)

    depeg = pd.read_csv(config.RAW_DEPEG_HOURLY_CSV).sort_values("timestamp")
    df = pd.merge_asof(
        df.sort_values("candle"),
        depeg[["timestamp", "liquidity"]].rename(columns={"timestamp": "candle", "liquidity": "L"}),
        on="candle", direction="backward",
    )
    df["L"] = df["L"].ffill().bfill()
    return df


def run_backtest(df: pd.DataFrame, s_calm: float) -> pd.DataFrame:
    P = config.POSITION_USD
    p_trough = df["usdc_usd"].min()
    worst_case = P * p_trough                    # subir le fond, sans agir

    # Slippage d'évacuation par bougie (ancre calme + effondrement de liquidité)
    l_ref = df.loc[df["candle"] < config.CALM_END_TS, "L"].median()
    df["exit_slip"] = slippage.exit_slippage(df["L"].values, l_ref, s_calm)

    calm = df[df["candle"] < config.CALM_END_TS]

    rows = []
    for tau in range(10, 100):
        trig = df[df["cbri"] >= tau]
        if trig.empty:
            continue
        e = trig.iloc[0]                          # 1re bougie qui franchit τ
        value_out = P * e["usdc_usd"] * (1.0 - e["exit_slip"])
        saved = value_out - worst_case
        # faux positifs : franchissements pendant la fenêtre calme (USDC au peg)
        n_fp = int((calm["cbri"] >= tau).any())
        rows.append({
            "tau": tau,
            "trigger_dt": e["dt"],
            "exit_price": e["usdc_usd"],
            "exit_slip_bps": e["exit_slip"] * 1e4,
            "value_out": value_out,
            "funds_saved": saved,
            "false_positive": n_fp,
        })
    res = pd.DataFrame(rows)
    res.attrs["worst_case"] = worst_case
    res.attrs["p_trough"] = p_trough
    return res


def pick_tau_star(res: pd.DataFrame) -> pd.Series:
    """τ* = seuil le plus HAUT atteignant les fonds sauvés max sans faux positif.

    Les fonds sauvés forment un plateau : tout τ jusqu'au sommet du plateau
    déclenche au même instant optimal (le CBRI bondit du bruit de fond à 50+).
    On prend le haut du plateau = marge de sécurité maximale vs faux alarmes.
    """
    clean = res[res["false_positive"] == 0]
    pool = clean if not clean.empty else res
    best = pool["funds_saved"].max()
    plateau = pool[pool["funds_saved"] >= best - 1.0]      # à $1 près
    star = plateau.loc[plateau["tau"].idxmax()].copy()
    star["plateau_lo"] = int(plateau["tau"].min())
    star["plateau_hi"] = int(plateau["tau"].max())
    return star


def make_plots(df: pd.DataFrame, res: pd.DataFrame, tau_star: pd.Series, s_calm: float):
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)

    # ── Figure 1 : CBRI vs prix USDC + déclenchement τ* ───────
    fig, ax1 = plt.subplots(figsize=(11, 5))
    ax1.plot(df["dt"], df["usdc_usd"], color="#111", lw=1.6, label="Prix USDC/USD")
    ax1.axhline(1.0, color="#999", ls=":", lw=1)
    ax1.set_ylabel("Prix USDC ($)", color="#111")
    ax1.set_ylim(0.84, 1.02)
    ax2 = ax1.twinx()
    ax2.fill_between(df["dt"], 0, df["cbri"], color="#e5484d", alpha=0.18)
    ax2.plot(df["dt"], df["cbri"], color="#e5484d", lw=1.3, label="CBRI")
    ax2.axhline(tau_star["tau"], color="#e5484d", ls="--", lw=1,
                label=f"τ* = {int(tau_star['tau'])}")
    ax2.set_ylabel("CBRI (risque)", color="#e5484d")
    ax2.set_ylim(0, 105)
    ax1.axvline(tau_star["trigger_dt"], color="#0a7", lw=2, alpha=0.8)
    ax1.annotate(f"ÉVACUATION\n{tau_star['trigger_dt']:%d/%m %H:%M}\n@ \\${tau_star['exit_price']:.3f}",
                 xy=(tau_star["trigger_dt"], 0.95), color="#0a7", fontsize=9, fontweight="bold")
    ax1.set_title("CircuitBreaker.ai — Depeg USDC (SVB, mars 2023) : le breaker sort à \\$%.3f, "
                  "le fond était à \\$%.3f" % (tau_star["exit_price"], res.attrs["p_trough"]))
    fig.legend(loc="lower left", bbox_to_anchor=(0.1, 0.12), fontsize=8)
    fig.tight_layout()
    fig.savefig(os.path.join(config.OUTPUT_DIR, "fig1_cbri_vs_price.png"), dpi=130)

    # ── Figure 2 : fonds sauvés = f(τ) (le money-slide) ───────
    fig, ax = plt.subplots(figsize=(11, 5))
    clean = res[res["false_positive"] == 0]
    fp = res[res["false_positive"] == 1]
    ax.plot(clean["tau"], clean["funds_saved"] / 1e3, color="#0a7", lw=2, label="Fiable (0 faux positif)")
    if not fp.empty:
        ax.plot(fp["tau"], fp["funds_saved"] / 1e3, color="#e5484d", lw=2, ls=":",
                label="Zone faux positifs (τ trop bas)")
    ax.axvline(tau_star["tau"], color="#111", ls="--", lw=1.2)
    ax.scatter([tau_star["tau"]], [tau_star["funds_saved"] / 1e3], color="#111", zorder=5, s=60)
    ax.annotate(f"  τ* = {int(tau_star['tau'])}\n  +\\${tau_star['funds_saved']/1e3:,.0f}k sauvés",
                xy=(tau_star["tau"], tau_star["funds_saved"] / 1e3), fontsize=10, fontweight="bold")
    ax.set_xlabel("Seuil de déclenchement τ (CBRI)")
    ax.set_ylabel("Fonds sauvés vs subir le fond (\\$k, sur \\$1M)")
    ax.set_title("À quel score déclencher ? Chaque point de CBRI attendu coûte de l'argent")
    ax.grid(alpha=0.2)
    ax.legend()
    fig.tight_layout()
    fig.savefig(os.path.join(config.OUTPUT_DIR, "fig2_funds_saved_vs_tau.png"), dpi=130)

    # ── Figure 3 : explosion du slippage + ancre exécution ───
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(df["dt"], df["exit_slip"] * 100, color="#c47", lw=1.6, label="Slippage sortie $1M (modèle v3)")
    ax.axhline(s_calm * 100, color="#0a7", ls="--", lw=1.4,
               label=f"Ancre exécution calme (Uniswap QuoterV2) = {s_calm*1e4:.0f} bps")
    ax.axvline(tau_star["trigger_dt"], color="#111", lw=1.5, alpha=0.7,
               label=f"Évacuation τ* @ {tau_star['exit_slip_bps']:.0f} bps")
    ax.set_ylabel("Slippage d'évacuation (%)")
    ax.set_title("La liquidité s'effondre → sortir tard coûte cher (sortir à τ* = quasi gratuit)")
    ax.grid(alpha=0.2)
    ax.legend()
    fig.tight_layout()
    fig.savefig(os.path.join(config.OUTPUT_DIR, "fig3_slippage_explosion.png"), dpi=130)
    plt.close("all")


def main():
    df = load_panel()

    s_calm = config.SLIP_CALM_DEFAULT
    print(f"⚓ Ancre exécution (calme) : {s_calm*1e4:.0f} bps "
          f"(validée live on-chain via Uniswap QuoterV2 dans live-execution/)")

    res = run_backtest(df, s_calm)
    tau_star = pick_tau_star(res)
    res.to_csv(os.path.join(config.OUTPUT_DIR, "backtest_tau_sweep.csv"), index=False)
    make_plots(df, res, tau_star, s_calm)

    p_trough = res.attrs["p_trough"]
    saved = tau_star["funds_saved"]
    fee = 0.10 * saved
    print("\n" + "=" * 62)
    print(f"  RÉSULTAT BACKTEST — Depeg USDC (SVB, mars 2023), position $1M")
    print("=" * 62)
    print(f"  Fond du depeg (sans agir) : ${p_trough:.4f}  → position = ${config.POSITION_USD*p_trough:,.0f}")
    print(f"  τ* optimal                : {int(tau_star['tau'])}  "
          f"(plateau optimal [{int(tau_star['plateau_lo'])}–{int(tau_star['plateau_hi'])}], 0 faux positif)")
    print(f"  Déclenchement             : {tau_star['trigger_dt']:%d/%m/%Y %H:%M} UTC")
    print(f"  Prix de sortie            : ${tau_star['exit_price']:.4f}  (slippage {tau_star['exit_slip_bps']:.0f} bps)")
    print(f"  Position évacuée          : ${tau_star['value_out']:,.0f} USDT")
    print(f"  💰 FONDS SAUVÉS           : ${saved:,.0f}  ({saved/config.POSITION_USD*100:.1f}% de la position)")
    print(f"  → success fee 10%         : ${fee:,.0f} de revenu")
    print("=" * 62)
    print(f"  Figures : {config.OUTPUT_DIR}/fig1_*.png  fig2_*.png  fig3_*.png")


if __name__ == "__main__":
    main()
