"""
Modèle de slippage de l'évacuation (exécution = swap Uniswap v3 direct).

Physique : le slippage d'une sortie de taille fixe ($1M) est inversement lié à
la profondeur disponible. On utilise la liquidité active L de la pool USDC/USDT
(qui s'effondre de ~7 ordres de grandeur pendant le depeg).

    slip(t) = min( CAP , s_calm · (L_ref / L(t))^BETA )

  - s_calm : coût en marché calme, validé live via Uniswap QuoterV2 (sinon 5 bps).
  - L_ref  : liquidité active médiane pré-crash -> slip(pré-crash) ≈ s_calm.
  - BETA<1 : tempère l'effondrement mono-tick (une sortie réelle traverse des ticks).
  - CAP    : plafond réaliste d'une sortie fractionnée.
"""
import numpy as np
import config


def exit_slippage(liquidity: np.ndarray, l_ref: float, s_calm: float) -> np.ndarray:
    """Slippage d'évacuation par bougie, vectorisé."""
    liquidity = np.asarray(liquidity, dtype="float64")
    ratio = np.where(liquidity > 0, l_ref / liquidity, np.inf)
    slip = s_calm * np.power(ratio, config.SLIP_BETA)
    return np.clip(slip, 0.0, config.SLIP_CAP)
