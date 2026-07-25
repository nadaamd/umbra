"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Eclipse — Umbra's signature instrument. Risk is rendered as an eclipse in
 * progress: a warm corona of light (the position at full value) is occluded by
 * the umbral disc as CBRI climbs. At totality the corona flares red (crisis);
 * moments later a green ring confirms Umbra has already evacuated the funds.
 */

const CYCLE = 8200;
const ARM = 40;
const TAU = 66;
const N = 120;

const IVORY = "#ece6d8";
const AMBER = "#f2a93b";
const RED = "#ff2233";
const GREEN = "#35c07a";

const ease = (x: number) => x * x * (3 - 2 * x);

function cbriAt(t: number): number {
  const j = Math.sin(t / 88) * 1.3 + Math.sin(t / 33) * 0.7;
  let base: number;
  if (t < 1600) base = 5;
  else if (t < 3200) base = 5 + 41 * ease((t - 1600) / 1600);
  else if (t < 4500) base = 46 + 48 * ease((t - 3200) / 1300);
  else if (t < 7000) base = 94;
  else base = 94 - 89 * ease((t - 7000) / 1200);
  return Math.max(1, Math.min(100, base + (base > 3 ? j : 0)));
}

function phaseOf(t: number, v: number) {
  const triggered = v >= TAU;
  // Umbra acts ~450ms into totality
  const evac = t >= 4950 && t < 7000;
  if (triggered) return { color: RED, phase: "TOTALITY", evac };
  if (v >= ARM) return { color: AMBER, phase: "PENUMBRA", evac: false };
  return { color: IVORY, phase: "FULL LIGHT", evac: false };
}

export function EclipseGauge() {
  const [v, setV] = useState(5);
  const tRef = useRef(0);
  const buf = useRef<number[]>(Array(N).fill(5));
  const [, force] = useState(0);
  const t0 = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (t0.current === null) t0.current = now;
      const t = (now - t0.current) % CYCLE;
      tRef.current = t;
      const val = cbriAt(t);
      buf.current.push(val);
      if (buf.current.length > N) buf.current.shift();
      setV(val);
      force((k) => k + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const t = tRef.current;
  const { color, phase, evac } = phaseOf(t, v);

  // geometry
  const W = 340;
  const H = 300;
  const cx = 170;
  const cy = 130;
  const R = 84;
  const progress = Math.min(1, v / TAU); // 0 → total eclipse at τ*
  const moonOffset = (1 - progress) * (R * 2.15); // slides from right to center
  const sunLum = 0.25 + 0.75 * (1 - progress); // disc brightness fades to dark
  const diamond = progress > 0.82 && progress < 1; // last light before totality

  // sparkline
  const pts = buf.current;
  const sy0 = 250;
  const sh = 40;
  const spark = pts
    .map((p, i) => `${(i / (N - 1)) * W},${sy0 + sh - (p / 100) * sh}`)
    .join(" ");
  const tauY = sy0 + sh - (TAU / 100) * sh;

  return (
    <div className="border border-line bg-umbra-2/60 tick-frame relative">
      {/* header rail */}
      <div className="flex items-center justify-between border-b border-line px-3 h-8 relative z-10">
        <span className="label">Eclipse · CBRI state</span>
        <span
          className="font-mono text-[10px] tracking-[0.12em]"
          style={{ color }}
        >
          {phase}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        style={{ background: "transparent" }}
      >
        <defs>
          <radialGradient id="sun" cx="50%" cy="46%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity={sunLum} />
            <stop offset="62%" stopColor={color} stopOpacity={sunLum * 0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.04} />
          </radialGradient>
          <radialGradient id="bloom" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <clipPath id="frame">
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>

        <g clipPath="url(#frame)">
          {/* atmospheric corona bloom */}
          <circle cx={cx} cy={cy} r={R + 46} fill="url(#bloom)" />

          {/* the sun disc (the position at value) */}
          <circle cx={cx} cy={cy} r={R} fill="url(#sun)" />

          {/* corona ring — the thin edge of light */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            opacity={0.35 + 0.55 * (1 - progress) + (phase === "TOTALITY" ? 0.5 : 0)}
          />

          {/* red prominences at totality */}
          {phase === "TOTALITY" &&
            [20, 150, 250, 320].map((a) => {
              const rad = (a * Math.PI) / 180;
              return (
                <line
                  key={a}
                  x1={cx + Math.cos(rad) * R}
                  y1={cy + Math.sin(rad) * R}
                  x2={cx + Math.cos(rad) * (R + 9 + (a % 3) * 3)}
                  y2={cy + Math.sin(rad) * (R + 9 + (a % 3) * 3)}
                  stroke={RED}
                  strokeWidth={1.5}
                  opacity={0.75}
                />
              );
            })}

          {/* the umbral moon — occludes from the right */}
          <circle
            cx={cx + moonOffset}
            cy={cy - moonOffset * 0.12}
            r={R + 4}
            fill="#050505"
            stroke="rgba(236,230,216,0.16)"
            strokeWidth={1}
          />

          {/* diamond-ring: the last point of light before totality */}
          {diamond && (
            <circle cx={cx - R * 0.96} cy={cy + 4} r={3.4} fill={IVORY} opacity={0.95} />
          )}

          {/* evacuation confirmation — green ring appears once Umbra acts */}
          {evac && (
            <>
              <circle
                cx={cx}
                cy={cy}
                r={R + 14}
                fill="none"
                stroke={GREEN}
                strokeWidth={1.2}
                strokeDasharray="3 5"
                opacity={0.85}
              />
              <text
                x={cx}
                y={cy + R + 40}
                textAnchor="middle"
                fontSize="11"
                fill={GREEN}
                fontFamily="var(--font-mono)"
                letterSpacing="0.12em"
              >
                ⎇ FUNDS EVACUATED → USDT
              </text>
            </>
          )}

          {/* CBRI numeric readout */}
          <text
            x={22}
            y={sy0 - 8}
            fontSize="11"
            fill="#6a6357"
            fontFamily="var(--font-mono)"
            letterSpacing="0.1em"
          >
            CBRI
          </text>
          <text
            x={22}
            y={sy0 + 32}
            fontSize="40"
            fill={color}
            fontFamily="var(--font-mono)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {v.toFixed(1)}
          </text>

          {/* raw quant sparkline */}
          <line x1="0" y1={tauY} x2={W} y2={tauY} stroke={RED} strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
          <polyline points={spark} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" opacity="0.9" />
          <text x={W - 6} y={tauY - 4} textAnchor="end" fontSize="9" fill={RED} fontFamily="var(--font-mono)">
            τ* 66
          </text>
        </g>
      </svg>
    </div>
  );
}
