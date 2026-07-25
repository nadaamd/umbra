"""
Moteur CBRI — transforme les données brutes The Graph en Score de Risque (0→100).

Pipeline :
  swaps  -> bougies 5 min : prix (sqrtPriceX96) + Order-Flow Imbalance (amount0)
  liq    -> fuite de liquidité nette par bougie (mints − burns)
  hourly -> TVL baseline (normalise la fuite) + ETH/USD réf (isole le depeg USDC)

3 sous-signaux -> sigmoïdes -> Noisy-OR -> CBRI.
"""
import numpy as np
import pandas as pd

import config


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def cbri_noisy_or(s_drain, s_ofi, s_depeg, w_drain=None, w_ofi=None, w_depeg=None):
    """Agrégation Noisy-OR pondérée -> CBRI ∈ [0,100]. Scalaire ou vectorisé.

    CBRI = 100·(1 − ∏(1 − wᵢ·sᵢ)) : le score saute si UN signal vire au rouge ;
    un poids wᵢ=0 neutralise complètement un signal non-informatif.
    """
    w_drain = config.W_DRAIN if w_drain is None else w_drain
    w_ofi = config.W_OFI if w_ofi is None else w_ofi
    w_depeg = config.W_DEPEG if w_depeg is None else w_depeg
    return 100.0 * (1.0 - (1 - w_drain * s_drain)
                          * (1 - w_ofi * s_ofi)
                          * (1 - w_depeg * s_depeg))


def price_from_sqrtx96(sqrtPriceX96: pd.Series) -> pd.Series:
    """sqrtPriceX96 -> prix USDC par WETH (unités humaines)."""
    price_raw = (sqrtPriceX96 / (2.0 ** 96)) ** 2          # token1_raw / token0_raw
    weth_per_usdc = price_raw * 10.0 ** (config.TOKEN0_DECIMALS - config.TOKEN1_DECIMALS)
    return 1.0 / weth_per_usdc                              # USDC par WETH


def _candle(ts: pd.Series) -> pd.Series:
    return (ts // config.CANDLE_SECONDS) * config.CANDLE_SECONDS


def build_features() -> pd.DataFrame:
    # ── Charge ────────────────────────────────────────────────
    swaps = pd.read_csv(config.RAW_SWAPS_CSV)
    liq = pd.read_csv(config.RAW_LIQ_CSV)
    hourly = pd.read_csv(config.RAW_HOURLY_CSV)
    depeg_pool = pd.read_csv(config.RAW_DEPEG_HOURLY_CSV)

    swaps["candle"] = _candle(swaps["timestamp"])

    # ── Agrégation swaps par bougie ───────────────────────────
    # (le prix USDC/USD vient de la pool stable USDC/USDT, pas de cette pool USDC/WETH)
    g = swaps.groupby("candle")[["amountUSD", "amount0"]]
    px = g.apply(lambda d: pd.Series({
        "volume_usd": d["amountUSD"].sum(),
        "net_a0": d["amount0"].sum(),                       # >0 = USDC vendu (fuite)
        "abs_a0": d["amount0"].abs().sum(),
        "n_swaps": len(d),
    }))

    # ── Fuite de liquidité par bougie (mints − burns) ─────────
    if not liq.empty:
        liq["candle"] = _candle(liq["timestamp"])
        net_liq = liq.groupby("candle")["liq_usd_signed"].sum().rename("net_liq_usd")
    else:
        net_liq = pd.Series(dtype="float64", name="net_liq_usd")

    # ── Grille de bougies continue (comble les trous) ─────────
    grid = pd.RangeIndex(config.START_TS, config.END_TS, config.CANDLE_SECONDS)
    df = pd.DataFrame(index=grid)
    df = df.join(px).join(net_liq)
    df.index.name = "candle"

    df["net_liq_usd"] = df["net_liq_usd"].fillna(0.0)
    df["volume_usd"] = df["volume_usd"].fillna(0.0)
    df["net_a0"] = df["net_a0"].fillna(0.0)
    df["abs_a0"] = df["abs_a0"].fillna(0.0)

    # ── Merge TVL (cible) + prix USDC/USD (pool stable) par ffill ─
    hourly = hourly.sort_values("timestamp")
    depeg_pool = depeg_pool.sort_values("timestamp")
    depeg_pool["usdc_usd"] = depeg_pool["token1Price"]   # USDC/USD direct (stable/stable)

    df = df.reset_index()
    df = pd.merge_asof(df, hourly[["timestamp", "tvlUSD"]].rename(columns={"timestamp": "candle"}),
                       on="candle", direction="backward")
    df = pd.merge_asof(df, depeg_pool[["timestamp", "usdc_usd"]].rename(columns={"timestamp": "candle"}),
                       on="candle", direction="backward")
    df["tvlUSD"] = df["tvlUSD"].ffill().bfill()
    df["usdc_usd"] = df["usdc_usd"].ffill().bfill()
    df = df.set_index("candle")

    # ── Signal 1 : vitesse de fuite de liquidité v_L ──────────
    win_h = config.DRAIN_WINDOW * config.CANDLE_SECONDS / 3600.0
    # min_periods plein : pas de fenêtre partielle en début de série (tue l'artefact de bord)
    rolled_liq = df["net_liq_usd"].rolling(config.DRAIN_WINDOW,
                                           min_periods=config.DRAIN_WINDOW).sum().fillna(0.0)
    df["drain_rate"] = (-rolled_liq / df["tvlUSD"]) / win_h        # fraction TVL / heure
    df["drain_rate"] = df["drain_rate"].clip(lower=0.0)            # on ne surveille que la SORTIE

    # ── Signal 2 : Order-Flow Imbalance (lissé) ───────────────
    net_roll = df["net_a0"].rolling(config.OFI_WINDOW, min_periods=1).sum()
    abs_roll = df["abs_a0"].rolling(config.OFI_WINDOW, min_periods=1).sum()
    df["ofi"] = (net_roll.abs() / abs_roll.replace(0.0, np.nan)).fillna(0.0)

    # ── Signal 3 : divergence de prix / depeg (lecture directe) ─
    df["depeg"] = (1.0 - df["usdc_usd"]).abs()

    # ── Sigmoïdes ─────────────────────────────────────────────
    df["s_drain"] = sigmoid(config.DRAIN_STEEPNESS * (df["drain_rate"] - config.DRAIN_THRESHOLD))
    df["s_ofi"] = sigmoid(config.OFI_STEEPNESS * (df["ofi"] - config.OFI_THRESHOLD))
    df["s_depeg"] = sigmoid(config.DEPEG_STEEPNESS * (df["depeg"] - config.DEPEG_THRESHOLD))

    # ── Agrégation Noisy-OR pondéré -> CBRI ───────────────────
    df["cbri"] = cbri_noisy_or(df["s_drain"], df["s_ofi"], df["s_depeg"])

    df["dt"] = pd.to_datetime(df.index, unit="s", utc=True)
    return df


def main():
    import os
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    df = build_features()
    df.to_csv(config.FEATURES_CSV)

    peak = df["cbri"].idxmax()
    trough = df["usdc_usd"].idxmin()
    print("✅ CBRI calculé\n")
    print(f"   bougies          : {len(df)}  ({config.CANDLE_SECONDS//60} min)")
    print(f"   USDC min         : {df['usdc_usd'].min():.4f} $ "
          f"@ {df.loc[trough,'dt']}")
    print(f"   CBRI max         : {df['cbri'].max():.1f}/100 "
          f"@ {df.loc[peak,'dt']}")
    print(f"   drain max        : {df['drain_rate'].max()*100:.1f} %/h")
    print(f"   OFI max          : {df['ofi'].max():.2f}")
    print(f"   → {config.FEATURES_CSV}\n")

    # Aperçu autour du pic
    show = df.loc[peak - 6*config.CANDLE_SECONDS: peak + 6*config.CANDLE_SECONDS]
    cols = ["dt", "usdc_usd", "drain_rate", "ofi", "s_drain", "s_ofi", "s_depeg", "cbri"]
    with pd.option_context("display.width", 160, "display.max_columns", None):
        print(show[cols].to_string(
            formatters={"drain_rate": "{:.3f}".format, "usdc_usd": "{:.4f}".format,
                        "ofi": "{:.2f}".format, "s_drain": "{:.2f}".format,
                        "s_ofi": "{:.2f}".format, "s_depeg": "{:.2f}".format,
                        "cbri": "{:.1f}".format}))


if __name__ == "__main__":
    main()
