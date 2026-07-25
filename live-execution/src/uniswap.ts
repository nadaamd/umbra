import {
  createPublicClient,
  createWalletClient,
  http,
  publicActions,
  parseAbi,
  maxUint256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { CONFIG } from "./config.js";

/**
 * Exécution de l'évacuation via Uniswap v3 en direct (aucune API externe).
 *  - Quote LIVE : QuoterV2.quoteExactInputSingle via eth_call (lecture RPC).
 *  - Exécution   : SwapRouter02.exactInputSingle (approve + swap).
 *
 * ⚠️ LIMITE MVP (assumée) : routage mono-pool (USDC/USDT 0.01%, exactInputSingle).
 * Or c'est justement cette pool dont le backtest montre l'effondrement de liquidité
 * en crise. En prod, l'évacuation doit router multi-pool / multi-hop (fractionner
 * l'ordre sur plusieurs tiers/venues) pour ne pas subir le mur de slippage — c'est
 * le prochain incrément (SwapRouter multi-path ou agrégateur on-chain).
 */

const QUOTER_ABI = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [{
      type: "tuple",
      name: "params",
      components: [
        { name: "tokenIn", type: "address" },
        { name: "tokenOut", type: "address" },
        { name: "amountIn", type: "uint256" },
        { name: "fee", type: "uint24" },
        { name: "sqrtPriceLimitX96", type: "uint160" },
      ],
    }],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

const ROUTER_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [{
      type: "tuple",
      name: "params",
      components: [
        { name: "tokenIn", type: "address" },
        { name: "tokenOut", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "recipient", type: "address" },
        { name: "amountIn", type: "uint256" },
        { name: "amountOutMinimum", type: "uint256" },
        { name: "sqrtPriceLimitX96", type: "uint160" },
      ],
    }],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const publicClient = () =>
  createPublicClient({ chain: mainnet, transport: http(CONFIG.RPC_URL) });

export interface Quote {
  dstAmount: bigint;
  outUsdt: number;
  slippageBps: number;
}

/** Slippage en bps d'une sortie (borné à 0 : un prix favorable n'est pas un coût). */
export function slippageBps(inHuman: number, outHuman: number): number {
  return Math.max(0, (1 - outHuman / inHuman) * 1e4);
}

/** Quote LIVE on-chain (read-only, aucun wallet requis). */
export async function getQuote(amountRaw: bigint): Promise<Quote> {
  const { result } = await publicClient().simulateContract({
    address: CONFIG.UNI_QUOTER_V2 as `0x${string}`,
    abi: QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: [{
      tokenIn: CONFIG.USDC as `0x${string}`,
      tokenOut: CONFIG.USDT as `0x${string}`,
      amountIn: amountRaw,
      fee: CONFIG.UNI_FEE,
      sqrtPriceLimitX96: 0n,
    }],
  });
  const dstAmount = result[0] as bigint;
  const outUsdt = Number(dstAmount) / 10 ** CONFIG.USDT_DECIMALS;
  const inUsdc = Number(amountRaw) / 10 ** CONFIG.USDC_DECIMALS;
  return { dstAmount, outUsdt, slippageBps: slippageBps(inUsdc, outUsdt) };
}

/** Exécute l'évacuation on-chain (mode LIVE) : approve USDC si besoin, puis swap. */
export async function executeSwap(amountRaw: bigint, minOut: bigint): Promise<`0x${string}`> {
  const account = privateKeyToAccount(CONFIG.EXECUTION_PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(CONFIG.RPC_URL),
  }).extend(publicActions);

  const allowance = await client.readContract({
    address: CONFIG.USDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, CONFIG.UNI_SWAP_ROUTER_02 as `0x${string}`],
  });
  if (allowance < amountRaw) {
    const approveHash = await client.writeContract({
      address: CONFIG.USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.UNI_SWAP_ROUTER_02 as `0x${string}`, maxUint256],
    });
    await client.waitForTransactionReceipt({ hash: approveHash });
  }

  return client.writeContract({
    address: CONFIG.UNI_SWAP_ROUTER_02 as `0x${string}`,
    abi: ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [{
      tokenIn: CONFIG.USDC as `0x${string}`,
      tokenOut: CONFIG.USDT as `0x${string}`,
      fee: CONFIG.UNI_FEE,
      recipient: account.address,
      amountIn: amountRaw,
      amountOutMinimum: minOut,
      sqrtPriceLimitX96: 0n,
    }],
  });
}
