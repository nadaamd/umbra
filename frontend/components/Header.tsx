"use client";

import { useBreaker } from "@/lib/store";
import { stamp } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

function SponsorChip({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-baseline gap-1.5 px-2 py-1 border border-line2 rounded-sm">
      <span className="font-mono text-[10px] text-ink2">{name}</span>
      <span className="font-mono text-[9px] tracking-wide uppercase text-ink4">
        {role}
      </span>
    </div>
  );
}

export function Header() {
  const { current, status, summary, ready } = useBreaker();
  return (
    <header className="h-14 shrink-0 border-b border-line bg-panel flex items-center justify-between px-4 relative z-10">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border border-line2 rounded-sm grid place-items-center bg-bg">
          {/* circuit-breaker glyph */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#e5484d" strokeWidth="1.6" />
            <path
              d="M13.5 6 L9 12.5 h3 L10.5 18 L15 11.5 h-3 Z"
              fill="#e5484d"
            />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[15px] tracking-tight text-ink">
            CircuitBreaker<span className="text-risk">.ai</span>
          </div>
          <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink3">
            Autonomous DeFi Risk Terminal
          </div>
        </div>
      </div>

      {/* Live replay stamp */}
      <div className="hidden md:flex items-center gap-4">
        <div className="text-center">
          <div className="label">Replay · {summary?.crash ?? "—"}</div>
          <div className="font-mono text-sm tabular-nums text-ink mt-0.5">
            {current ? stamp(current.t) : "—— ——— ——:——"}{" "}
            <span className="text-ink3 text-[11px]">UTC</span>
          </div>
        </div>
        <div className="h-8 w-px bg-line" />
        <StatusBadge status={status} size="md" />
      </div>

      {/* Sponsors + system */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5">
          <SponsorChip name="The Graph" role="data" />
          <SponsorChip name="0G" role="infra" />
          <SponsorChip name="1inch" role="exec" />
        </div>
        <div className="flex items-center gap-1.5 pl-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              ready ? "bg-safe animate-pulse-dot" : "bg-ink4"
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink3">
            {ready ? "online" : "sync"}
          </span>
        </div>
      </div>
    </header>
  );
}
