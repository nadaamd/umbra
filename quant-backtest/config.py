"""
Configuration centrale du backtest CircuitBreaker.ai.
Tout ce qu'on est susceptible de tuner pour la démo est ici.
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ─────────────────────────────────────────────────────────────
# The Graph — réseau décentralisé (gateway)
# ─────────────────────────────────────────────────────────────
THEGRAPH_API_KEY = os.getenv("THEGRAPH_API_KEY", "")
SUBGRAPH_ID = os.getenv("UNISWAP_V3_SUBGRAPH_ID", "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV")
SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{THEGRAPH_API_KEY}/subgraphs/id/{SUBGRAPH_ID}"

# ─────────────────────────────────────────────────────────────
# Pool cible : USDC / WETH 0.05% (Uniswap v3, Ethereum mainnet)
#   token0 = USDC (6 décimales)   |   token1 = WETH (18 décimales)
# ─────────────────────────────────────────────────────────────
POOL_ADDRESS = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
TOKEN0_SYMBOL, TOKEN0_DECIMALS = "USDC", 6
TOKEN1_SYMBOL, TOKEN1_DECIMALS = "WETH", 18

# Pool du depeg : USDC / USDT 0.01% (la stable/stable la plus profonde).
#   token1Price = prix USDC/USD direct (1.000 au repos, 0.8726 au fond SVB).
#   Lecture directe -> pas de ratio ETH, pas de décalage de granularité.
DEPEG_POOL_ADDRESS = "0x3416cf6c708da44db2624d63ea0aaef7113527c6"

# ─────────────────────────────────────────────────────────────
# Fenêtre du crash de référence : depeg USDC (SVB) — mars 2023
#   10 mars 00:00 UTC  →  13 mars 00:00 UTC
# ─────────────────────────────────────────────────────────────
CRASH_NAME = "USDC_depeg_SVB_2023-03"
START_TS = 1678406400   # 2023-03-10 00:00:00 UTC
END_TS   = 1678665600   # 2023-03-13 00:00:00 UTC

# ─────────────────────────────────────────────────────────────
# Résolution temporelle du backtest
# ─────────────────────────────────────────────────────────────
CANDLE_SECONDS = 5 * 60  # bougies de 5 minutes

# ─────────────────────────────────────────────────────────────
# Paramètres du modèle CBRI (sigmoïdes des 3 sous-signaux)
#   s = σ(α · (x − seuil))   puis   CBRI = 100·(1 − ∏(1 − s))  [Noisy-OR]
# Tunables en live pendant la démo.
# ─────────────────────────────────────────────────────────────
# Calibration : chaque sigmoïde doit valoir ≈0 au repos et ≈1 en crise.
# 1. Fuite de liquidité : v_L = fraction du TVL qui s'évade par heure
DRAIN_THRESHOLD = 0.06    # 6 %/h = knee ; s(0)=0.05, s(16%)≈1
DRAIN_STEEPNESS = 60.0
DRAIN_WINDOW = 9          # lissage : somme glissante sur 9 bougies (45 min)

# 2. Order-Flow Imbalance : I ∈ [0,1], unidirectionnalité du flux
OFI_THRESHOLD = 0.30      # signal faible sur ce crash -> seuil bas pour le rendre réactif
OFI_STEEPNESS = 15.0
OFI_WINDOW = 6

# 3. Divergence de prix / depeg : D = |1 − prix_USDC|
DEPEG_THRESHOLD = 0.012   # centre ~1.2 % ; s(0.3%)≈0 (bruit de peg normal), s(2%)≈0.9
DEPEG_STEEPNESS = 250.0

# Poids du Noisy-OR pondéré : CBRI = 100·(1 − ∏(1 − wᵢ·sᵢ))
# w=0 neutralise un signal non-informatif. OFI non-discriminant sur ce crash
# (calme ≈ crise ≈ 0.5) -> down-weighté à 0, gardé en diagnostic.
W_DRAIN = 1.0
W_OFI = 0.0
W_DEPEG = 1.0

# ─────────────────────────────────────────────────────────────
# Backtest / évacuation
# ─────────────────────────────────────────────────────────────
POSITION_USD = 1_000_000          # position type évacuée : $1M USDC
SAFE_ASSET = "USDT"               # actif refuge (a tenu son peg pendant SVB)

# Modèle de slippage v3 tempéré (exécution = swap Uniswap v3 direct) :
#   slip(t) = min(CAP, s_calm · (L_ref / L(t))^BETA)
# L = liquidité active de la pool USDC/USDT (s'effondre x2e7 pendant le crash).
# BETA<1 tempère l'effondrement mono-tick (une sortie réelle traverse des ticks).
SLIP_BETA = 0.30
SLIP_CAP = 0.30                   # plafond réaliste d'une sortie fractionnée
# Ancre calme = coût d'exécution en marché normal, validée live on-chain via
# le QuoterV2 Uniswap (cf. live-execution/src/uniswap.ts).
SLIP_CALM_DEFAULT = 0.0005        # 5 bps

# Fenêtre "calme" de référence (USDC encore au peg) pour mesurer les faux positifs
CALM_END_TS = 1678449600          # 2023-03-10 12:00 UTC

# Adresses tokens (Ethereum mainnet)
USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

# ─────────────────────────────────────────────────────────────
# Chemins
# ─────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
RAW_SWAPS_CSV = os.path.join(DATA_DIR, f"swaps_{CRASH_NAME}.csv")
RAW_LIQ_CSV = os.path.join(DATA_DIR, f"liq_events_{CRASH_NAME}.csv")
RAW_HOURLY_CSV = os.path.join(DATA_DIR, f"pool_hourly_{CRASH_NAME}.csv")
RAW_DEPEG_HOURLY_CSV = os.path.join(DATA_DIR, f"depeg_hourly_{CRASH_NAME}.csv")
FEATURES_CSV = os.path.join(OUTPUT_DIR, f"cbri_{CRASH_NAME}.csv")
