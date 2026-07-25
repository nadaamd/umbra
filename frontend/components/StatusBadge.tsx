import { ShieldCheck, AlertTriangle, Zap } from "lucide-react";
import type { BreakerStatus } from "@/lib/types";

const CONF = {
  SAFE: {
    color: "text-safe",
    border: "border-safe/40",
    bg: "bg-safe/10",
    dot: "bg-safe",
    Icon: ShieldCheck,
    label: "SAFE",
  },
  ARMED: {
    color: "text-armed",
    border: "border-armed/45",
    bg: "bg-armed/10",
    dot: "bg-armed",
    Icon: AlertTriangle,
    label: "ARMED",
  },
  TRIGGERED: {
    color: "text-risk",
    border: "border-risk/50",
    bg: "bg-risk/12",
    dot: "bg-risk",
    Icon: Zap,
    label: "TRIGGERED",
  },
} as const;

export function StatusBadge({
  status,
  size = "md",
}: {
  status: BreakerStatus;
  size?: "sm" | "md" | "lg";
}) {
  const c = CONF[status];
  const pad = size === "lg" ? "px-3 h-9 text-sm" : size === "sm" ? "px-1.5 h-5 text-[10px]" : "px-2 h-7 text-xs";
  const icon = size === "lg" ? 16 : size === "sm" ? 11 : 13;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-sm font-mono tracking-[0.1em] uppercase ${pad} ${c.color} ${c.border} ${c.bg}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${c.dot} ${
          status !== "SAFE" ? "animate-pulse-dot" : ""
        }`}
      />
      <c.Icon size={icon} strokeWidth={2.2} />
      {c.label}
    </span>
  );
}
