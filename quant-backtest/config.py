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
# Chemins
# ─────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
RAW_SWAPS_CSV = os.path.join(DATA_DIR, f"swaps_{CRASH_NAME}.csv")
