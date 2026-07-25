"""
Test end-to-end du pipeline quant sur DONNÉES RÉELLES (depeg USDC, mars 2023).

Enchaîne : données The Graph -> CBRI (features) -> backtest -> τ*.
Vérifie les chiffres phares du pitch. Skippé proprement si les données ne sont
pas encore extraites (lance `python thegraph_client.py` d'abord).
"""
import os
import pytest
import pandas as pd

import config
import features
import backtest


pytestmark = pytest.mark.e2e

REQUIRED = [config.RAW_SWAPS_CSV, config.RAW_LIQ_CSV,
            config.RAW_HOURLY_CSV, config.RAW_DEPEG_HOURLY_CSV]


@pytest.fixture(scope="module")
def pipeline():
    if not all(os.path.exists(p) for p in REQUIRED):
        pytest.skip("Données absentes — lance `python thegraph_client.py` d'abord.")
    df = features.build_features()
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    df.to_csv(config.FEATURES_CSV)
    panel = backtest.load_panel()
    res = backtest.run_backtest(panel, config.SLIP_CALM_DEFAULT)
    star = backtest.pick_tau_star(res)
    return {"df": df, "res": res, "star": star}


# ── Le CBRI sur données réelles ──────────────────────────────
def test_cbri_baseline_is_calm(pipeline):
    df = pipeline["df"]
    calm = df[df.index < config.CALM_END_TS]  # 'candle' est l'index
    assert calm["cbri"].mean() < 15          # repos bas en marché calme


def test_cbri_saturates_in_crisis(pipeline):
    assert pipeline["df"]["cbri"].max() == pytest.approx(100.0, abs=0.5)


def test_usdc_trough_matches_reality(pipeline):
    # l'USDC a réellement touché ~$0.87 pendant SVB
    assert pipeline["df"]["usdc_usd"].min() == pytest.approx(0.8726, abs=0.01)


# ── Le backtest / τ* (chiffres du pitch) ─────────────────────
def test_tau_star_is_66(pipeline):
    assert int(pipeline["star"]["tau"]) == 66


def test_funds_saved_around_127k(pipeline):
    saved = pipeline["star"]["funds_saved"]
    assert 120_000 < saved < 132_000         # ~$126.9k sur $1M


def test_evacuation_exits_near_par(pipeline):
    # au déclenchement optimal, on sort quasi au peg (alerte précoce)
    assert pipeline["star"]["exit_price"] > 0.99


def test_waiting_costs_money(pipeline):
    # monotonie : attendre (τ élevé) sauve moins que déclencher tôt
    res = pipeline["res"].set_index("tau")
    assert res.loc[66, "funds_saved"] > res.loc[95, "funds_saved"]
