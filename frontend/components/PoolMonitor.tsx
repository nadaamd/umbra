"use client";

import { useBreaker } from "@/lib/store";
import { addr, usdCompact, price2, price4 } from "@/lib/format";
import { Stat } from "./ui";
import { ExternalLink, Droplets } from "lucide-react";

export function PoolMonitor() {
  const { current, summary } = useBreaker();
  const c = current;
  const usdc = c?.usdc ?? 1;
  const depegBps = Math.abs(1 - usdc) * 1e4;
  const ofi = c?.ofi ?? 0;
  const draining = (c?.netLiq ?? 0) < 0;

  const depegTone = depegBps > 120 ? "risk" : depegBps > 40 ? "armed" : "safe";
  const depegColor =
    depegBps > 120 ? "#ff2233" : depegBps > 40 ? "#f2a93b" : "#35c07a";

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* pool identity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-s1" />
          <div>
            <div className="font-mono text-[13px] text-ink leading-tight">
              {summary?.pool ?? "USDC / WETH 0.05%"}
            </div>
            <div className="font-mono text-[9px] text-ink3">
              Uniswap v3 · Ethereum
            </div>
          </div>
        </div>
        <a
          className="flex items-center gap-1 font-mono text-[10px] text-ink3 hover:text-ink2 border border-line2 rounded-sm px-1.5 py-1"
          href={`https://info.uniswap.org/#/pools/${summary?.poolAddr ?? ""}`}
          target="_blank"
          rel="noreferrer"
        >
          {addr(summary?.poolAddr ?? "0x88e6a0c2…5640")}
          <ExternalLink size={10} />
        </a>
      </div>

      {/* key stats */}
      <div className="grid grid-cols-2 gap-px bg-line border border-line rounded-sm overflow-hidden">
        <div className="bg-panel p-2.5">
          <Stat label="TVL" value={usdCompact(c?.tvl ?? 0)} />
        </div>
        <div className="bg-panel p-2.5">
          <Stat label="Spot" value={`${price2(c?.weth ?? 0)}`} sub="USDC / WETH" />
        </div>
        <div className="bg-panel p-2.5">
          <Stat
            label="USDC Peg"
            value={price4(usdc)}
            tone={depegTone as any}
          />
        </div>
        <div className="bg-panel p-2.5">
          <Stat
            label="Swaps / 5m"
            value={c?.nSwaps ?? 0}
            sub={usdCompact(c?.vol ?? 0)}
          />
        </div>
      </div>

      {/* price divergence bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label">Price Divergence · |1 − USDC|</span>
          <span
            className="font-mono text-[11px] tabular-nums"
            style={{ color: depegColor }}
          >
            {depegBps.toFixed(0)} bps
          </span>
        </div>
        <div className="relative h-2 bg-raised rounded-sm overflow-hidden">
          {/* peg center */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-line2" />
          <div
            className="absolute left-0 top-0 bottom-0 rounded-sm transition-all"
            style={{
              width: `${Math.min(100, (depegBps / 1300) * 100)}%`,
              background: depegColor,
            }}
          />
          {/* threshold tick at DEPEG_THRESHOLD 1.2% = 120bps */}
          <div
            className="absolute top-0 bottom-0 w-px bg-armed/70"
            style={{ left: `${(120 / 1300) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 font-mono text-[9px] text-ink4">
          <span>peg</span>
          <span className="text-armed/70">τ 120bps</span>
          <span>13% depeg</span>
        </div>
      </div>

      {/* order-flow imbalance */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label">Order-Flow Imbalance |I|</span>
          <span className="font-mono text-[10px] text-ink3">
            {draining ? "NET LIQ OUTFLOW" : "NET LIQ INFLOW"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink4 w-8">bal</span>
          <div className="flex-1 h-2 bg-raised rounded-sm overflow-hidden relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-line2" />
            <div
              className="absolute top-0 bottom-0 rounded-sm"
              style={{
                left: "50%",
                width: `${(ofi * 50).toFixed(1)}%`,
                background: draining ? "#d95926" : "#ece6d8",
              }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-ink w-9 text-right">
            {ofi.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
