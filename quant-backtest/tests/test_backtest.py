"""Tests de la logique backtest : sélection de τ* et calcul des fonds sauvés."""
import pandas as pd
import pytest

import config
from backtest import pick_tau_star, run_backtest


# ── pick_tau_star : haut du plateau, sans faux positif ───────
def test_pick_tau_star_returns_top_of_plateau():
    res = pd.DataFrame({
        "tau": list(range(10, 41)),
        # plateau à 100k pour τ∈[10,30], puis décroît
        "funds_saved": [100_000] * 21 + [90_000, 80_000, 70_000, 60_000,
                                         50_000, 40_000, 30_000, 20_000, 10_000, 0],
        "false_positive": [0] * 31,
    })
    star = pick_tau_star(res)
    assert star["tau"] == 30              # haut du plateau, pas 10
    assert star["plateau_lo"] == 10
    assert star["plateau_hi"] == 30


def test_pick_tau_star_avoids_false_positives():
    res = pd.DataFrame({
        "tau": [10, 20, 30, 40, 50],
        "funds_saved": [200_000, 200_000, 100_000, 100_000, 80_000],
        "false_positive": [1, 1, 0, 0, 0],   # les gros gains déclenchent en faux
    })
    star = pick_tau_star(res)
    assert star["false_positive"] == 0
    assert star["tau"] in (30, 40)           # meilleur parmi les fiables


# ── run_backtest : mécanique des fonds sauvés ────────────────
def _synthetic_panel():
    calm = config.START_TS
    crisis = config.CALM_END_TS
    rows = [
        (calm,        5,  1.00, 3e17),   # marché calme
        (calm + 300,  8,  1.00, 3e17),
        (crisis,      70, 0.99, 1e15),   # le crash démarre
        (crisis + 300, 90, 0.95, 1e13),
        (crisis + 600, 100, 0.90, 1e11), # fond
    ]
    df = pd.DataFrame(rows, columns=["candle", "cbri", "usdc_usd", "L"])
    df["dt"] = pd.to_datetime(df["candle"], unit="s", utc=True)
    return df


def test_run_backtest_saves_positive_funds():
    df = _synthetic_panel()
    res = run_backtest(df, config.SLIP_CALM_DEFAULT)
    assert not res.empty
    assert res.attrs["p_trough"] == pytest.approx(0.90)
    assert res.attrs["worst_case"] == pytest.approx(config.POSITION_USD * 0.90)
    # évacuer tôt (au premier franchissement) sauve des fonds vs subir le fond
    assert res["funds_saved"].max() > 0


def test_run_backtest_earlier_beats_later():
    df = _synthetic_panel()
    res = run_backtest(df, config.SLIP_CALM_DEFAULT).set_index("tau")
    # un seuil bas sort à $0.99, un seuil élevé sort à $0.90 -> sauve moins
    assert res.loc[66, "funds_saved"] > res.loc[95, "funds_saved"]


def test_run_backtest_no_false_positive_in_calm():
    df = _synthetic_panel()
    res = run_backtest(df, config.SLIP_CALM_DEFAULT)
    # τ=66 ne se déclenche jamais pendant la fenêtre calme (cbri max calme = 8)
    assert res.set_index("tau").loc[66, "false_positive"] == 0
