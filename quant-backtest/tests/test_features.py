"""Tests du moteur CBRI : sigmoïde, prix v3, agrégation Noisy-OR."""
import numpy as np
import pandas as pd
import pytest

import config
from features import sigmoid, price_from_sqrtx96, cbri_noisy_or


# ── sigmoïde ─────────────────────────────────────────────────
def test_sigmoid_midpoint():
    assert sigmoid(0.0) == pytest.approx(0.5)


def test_sigmoid_bounds():
    assert sigmoid(50) == pytest.approx(1.0, abs=1e-6)
    assert sigmoid(-50) == pytest.approx(0.0, abs=1e-6)


def test_sigmoid_monotone():
    xs = np.linspace(-5, 5, 50)
    ys = sigmoid(xs)
    assert np.all(np.diff(ys) > 0)


# ── prix depuis sqrtPriceX96 ─────────────────────────────────
def test_price_from_sqrtx96_realistic():
    # valeur réelle observée dans les données (ETH ~ $1436 le 10/03/2023)
    px = price_from_sqrtx96(pd.Series([2.090460e33]))
    assert 1400 < px.iloc[0] < 1470


def test_price_from_sqrtx96_monotone():
    # sqrtPriceX96 plus grand -> plus de WETH par USDC -> USDC/WETH plus BAS
    lo = price_from_sqrtx96(pd.Series([2.0e33])).iloc[0]
    hi = price_from_sqrtx96(pd.Series([2.2e33])).iloc[0]
    assert hi < lo


# ── Noisy-OR ─────────────────────────────────────────────────
def test_noisy_or_all_calm_is_zero():
    assert cbri_noisy_or(0.0, 0.0, 0.0, 1.0, 1.0, 1.0) == pytest.approx(0.0)


def test_noisy_or_all_red_is_100():
    assert cbri_noisy_or(1.0, 1.0, 1.0, 1.0, 1.0, 1.0) == pytest.approx(100.0)


def test_noisy_or_single_signal_saturates():
    # propriété disjoncteur : UN seul signal à 1 suffit à faire sauter le score
    assert cbri_noisy_or(1.0, 0.0, 0.0, 1.0, 1.0, 1.0) == pytest.approx(100.0)
    assert cbri_noisy_or(0.0, 0.0, 1.0, 1.0, 1.0, 1.0) == pytest.approx(100.0)


def test_noisy_or_zero_weight_neutralises_signal():
    # w_ofi = 0 => le signal OFI ne contribue jamais, quelle que soit sa valeur
    with_ofi = cbri_noisy_or(0.0, 1.0, 0.0, 1.0, 0.0, 1.0)
    without = cbri_noisy_or(0.0, 0.0, 0.0, 1.0, 0.0, 1.0)
    assert with_ofi == pytest.approx(without) == pytest.approx(0.0)


def test_noisy_or_bounded_and_increasing():
    a = cbri_noisy_or(0.2, 0.0, 0.1, 1.0, 1.0, 1.0)
    b = cbri_noisy_or(0.5, 0.0, 0.4, 1.0, 1.0, 1.0)
    assert 0.0 <= a < b <= 100.0


def test_noisy_or_uses_config_weights_by_default():
    # par défaut w_ofi=0 dans la config -> OFI ignoré
    assert config.W_OFI == 0.0
    default = cbri_noisy_or(0.0, 0.9, 0.0)
    assert default == pytest.approx(0.0)
