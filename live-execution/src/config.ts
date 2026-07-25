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

  // ── 1inch ──────────────────────────────────────────────────
  ONEINCH_API_KEY: process.env.ONEINCH_API_KEY ?? "",
  ONEINCH_BASE: "https://api.1inch.dev/swap/v6.0",
  MAX_SLIPPAGE_PCT: 1, // tolérance de slippage de l'ordre (%)

  // ── Exécution ──────────────────────────────────────────────
  // DRY_RUN=false + EXECUTION_PRIVATE_KEY => envoie la tx pour de vrai.
  DRY_RUN: process.env.DRY_RUN !== "false",
  EXECUTION_PRIVATE_KEY: process.env.EXECUTION_PRIVATE_KEY ?? "",
  RPC_URL: process.env.RPC_URL ?? "https://eth.llamarpc.com",

  // ── Chemin du flux CBRI (le cerveau Python) ────────────────
  CBRI_CSV: resolve(__dirname, "../../quant-backtest/output/cbri_USDC_depeg_SVB_2023-03.csv"),
};

export const positionRaw = () =>
  BigInt(Math.round(CONFIG.POSITION_USDC * 10 ** CONFIG.USDC_DECIMALS));
