"use client";

import { BreakerProvider } from "@/lib/store";
import { Panel } from "@/components/ui";
import { Header } from "@/components/Header";
import { KpiTape } from "@/components/KpiTape";
import { RiskGauge } from "@/components/RiskGauge";
import { CbriChart } from "@/components/CbriChart";
import { PoolMonitor } from "@/components/PoolMonitor";
import { DrainChart } from "@/components/DrainChart";
import { BacktestSimulator } from "@/components/BacktestSimulator";
import { ExecutionPanel } from "@/components/ExecutionPanel";
import { ReplayControls } from "@/components/ReplayControls";

export default function Page() {
  return (
    <BreakerProvider>
      <div className="h-screen flex flex-col bg-bg relative z-[2]">
        <Header />
        <KpiTape />

        <main className="flex-1 min-h-0 grid grid-cols-12 gap-2 p-2">
          {/* LEFT — the core + evolution + pool + drain */}
          <div className="col-span-12 xl:col-span-8 grid grid-cols-1 xl:grid-cols-8 xl:grid-rows-[1.08fr_0.92fr] gap-2 min-h-0">
            <Panel
              title="CBRI Core"
              tag="live"
              className="xl:col-span-3 min-h-[300px] xl:min-h-0"
              bodyClass="min-h-0"
            >
              <RiskGauge />
            </Panel>

            <Panel
              title="Risk Evolution"
              tag="CBRI ∥ USDC · 5m"
              className="xl:col-span-5 min-h-[300px] xl:min-h-0"
              bodyClass="min-h-0"
            >
              <CbriChart />
            </Panel>

            <Panel
              title="Pool Monitor"
              tag="Uniswap v3"
              className="xl:col-span-3 min-h-[240px] xl:min-h-0"
              bodyClass="min-h-0"
            >
              <PoolMonitor />
            </Panel>

            <Panel
              title="Liquidity Flight"
              tag="ΔL/Δt"
              className="xl:col-span-5 min-h-[240px] xl:min-h-0"
              bodyClass="min-h-0"
            >
              <DrainChart />
            </Panel>
          </div>

          {/* RIGHT — backtest simulator + execution */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-2 min-h-0">
            <Panel
              title="Backtest · Threshold τ"
              tag="SVB depeg 2023"
              className="flex-[1.15] min-h-[420px] xl:min-h-0"
              bodyClass="min-h-0"
            >
              <BacktestSimulator />
            </Panel>

            <Panel
              title="Execution & Status"
              tag="1inch best-exec"
              className="flex-1 min-h-[300px] xl:min-h-0"
              bodyClass="min-h-0"
            >
              <ExecutionPanel />
            </Panel>
          </div>
        </main>

        <ReplayControls />
      </div>
    </BreakerProvider>
  );
}
