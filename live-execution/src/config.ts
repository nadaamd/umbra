import { config as dotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// .env est à la racine du repo (partagé avec le back Python)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv({ path: resolve(__dirname, "../../.env") });

export const CONFIG = {
  // ── Déclenchement ──────────────────────────────────────────
  TAU_STAR: 66, // seuil optimal prouvé par le backtest (plateau [10–66])
  CHAIN_ID: 1, // Ethereum mainnet

  // ── Position à évacuer : $1M USDC -> USDT (actif refuge) ────
  POSITION_USDC: 1_000_000,
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC_DECIMALS: 6,
  USDT_DECIMALS: 6,

  // ── Exécution : swap Uniswap v3 direct (on-chain, sans API) ─
  // Pool d'évacuation : USDC/USDT 0.01% (fee = 100), le stable/stable le plus profond.
  UNI_FEE: 100,
  UNI_QUOTER_V2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  UNI_SWAP_ROUTER_02: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  MAX_SLIPPAGE_PCT: 1, // tolérance de slippage de l'ordre (%)

  // ── Exécution ──────────────────────────────────────────────
  // DRY_RUN=false + EXECUTION_PRIVATE_KEY => envoie la tx pour de vrai.
  DRY_RUN: process.env.DRY_RUN !== "false",
  EXECUTION_PRIVATE_KEY: process.env.EXECUTION_PRIVATE_KEY ?? "",
  RPC_URL: process.env.RPC_URL ?? "https://ethereum-rpc.publicnode.com",

  // ── Chemin du flux CBRI (le cerveau Python) ────────────────
  CBRI_CSV: resolve(__dirname, "../../quant-backtest/output/cbri_USDC_depeg_SVB_2023-03.csv"),

  // ── 0G — traçabilité décentralisée du modèle & des scores ──
  ZEROG_RPC: process.env.ZEROG_RPC_URL ?? "https://evmrpc-testnet.0g.ai",
  ZEROG_INDEXER: "https://indexer-storage-testnet-turbo.0g.ai",
  ZEROG_PRIVATE_KEY: process.env.ZEROG_PRIVATE_KEY ?? "",
  ZEROG_EXPLORER: "https://storagescan-galileo.0g.ai/tx",
  ATTESTATION_JSON: resolve(__dirname, "../../quant-backtest/output/cbri_attestation.json"),
};

// Spécification du modèle CBRI ancrée sur 0G (miroir de quant-backtest/config.py).
export const CBRI_MODEL_SPEC = {
  name: "CBRI",
  full_name: "CircuitBreaker Risk Index",
  version: "1.0.0",
  aggregation: "weighted Noisy-OR: CBRI = 100·(1 − ∏(1 − wᵢ·sᵢ)),  sᵢ = σ(αᵢ·(xᵢ − seuilᵢ))",
  candle_seconds: 300,
  signals: {
    liquidity_drain: { threshold: 0.06, steepness: 60, window: 9, weight: 1.0, unit: "fraction TVL / h" },
    order_flow_imbalance: { threshold: 0.3, steepness: 15, window: 6, weight: 0.0, note: "non-discriminant sur ce crash" },
    depeg_divergence: { threshold: 0.012, steepness: 250, weight: 1.0, source: "pool stable USDC/USDT" },
  },
  tau_star: 66,
} as const;

export const positionRaw = () =>
  BigInt(Math.round(CONFIG.POSITION_USDC * 10 ** CONFIG.USDC_DECIMALS));
