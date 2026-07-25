"""Tests du modèle de slippage (inverse de la profondeur, calibré + plafonné)."""
import numpy as np
import pytest

import config
from slippage import exit_slippage


L_REF = 3.324e17          # liquidité active médiane pré-crash (données réelles)
S_CALM = config.SLIP_CALM_DEFAULT


def test_slip_at_reference_equals_calm():
    # à la liquidité de référence, le slippage doit valoir l'ancre calme
    slip = exit_slippage(np.array([L_REF]), L_REF, S_CALM)
    assert slip[0] == pytest.approx(S_CALM, rel=1e-6)


def test_slip_increases_as_liquidity_falls():
    slips = exit_slippage(np.array([L_REF, L_REF / 100, L_REF / 1e4]), L_REF, S_CALM)
    assert slips[0] < slips[1] < slips[2]


def test_slip_capped():
    # effondrement extrême de la liquidité -> slippage plafonné au CAP
    slip = exit_slippage(np.array([1e7]), L_REF, S_CALM)
    assert slip[0] == pytest.approx(config.SLIP_CAP)


def test_slip_zero_liquidity_hits_cap():
    slip = exit_slippage(np.array([0.0]), L_REF, S_CALM)
    assert slip[0] == pytest.approx(config.SLIP_CAP)


def test_slip_never_exceeds_cap():
    Ls = np.logspace(9, 18, 40)
    slips = exit_slippage(Ls, L_REF, S_CALM)
    assert np.all(slips <= config.SLIP_CAP + 1e-12)
    assert np.all(slips >= 0.0)
