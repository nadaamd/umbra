import { UmbraMark } from "@/components/UmbraMark";
import { EclipseGauge } from "@/components/landing/EclipseGauge";
import { EclipseGlyph } from "@/components/landing/EclipseGlyph";
import { Reveal } from "@/components/landing/Reveal";
import { ArrowRight, Github, ArrowUpRight } from "lucide-react";

const GITHUB = "https://github.com/nadaamd/umbra";
const DEMO = "/terminal";

/* ── eclipse primitives ─────────────────────────────────────── */

/** A tiny eclipse at a given occlusion (0 = full light, 1 = totality). */
function MiniEclipse({
  p,
  color = "#ece6d8",
  size = 16,
}: {
  p: number;
  color?: string;
  size?: number;
}) {
  const id = `me-${p}-${color.replace("#", "")}`;
  const moonCx = 12 + (1 - p) * 15;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <mask id={id}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx={moonCx} cy="11" r="8" fill="#000" />
      </mask>
      <circle cx="12" cy="12" r="7.6" fill={color} mask={`url(#${id})`} />
      <circle cx="12" cy="12" r="8.6" stroke={color} strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

function SectionTag({
  n,
  p,
  color,
  children,
}: {
  n: string;
  p: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <MiniEclipse p={p} color={color} />
      <span className="font-mono text-[11px] text-ink3">{n}</span>
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink3">
        {children}
      </span>
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}

function Metric({
  value,
  label,
  tone = "ink",
}: {
  value: string;
  label: string;
  tone?: "ink" | "risk" | "safe";
}) {
  const c =
    tone === "risk" ? "text-risk" : tone === "safe" ? "text-safe" : "text-ink";
  return (
    <div className="border border-line p-5 bg-penumbra/40 hover:bg-penumbra transition-colors tick-frame">
      <div className={`font-mono tabular-nums text-3xl md:text-4xl ${c}`}>
        {value}
      </div>
      <div className="label mt-2">{label}</div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-umbra text-ink relative">
      {/* NAV — solid umbra, no glass */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-line bg-umbra">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <UmbraMark size={22} />
            <span className="font-display font-bold text-[17px] tracking-[0.06em]">
              UMBRA
            </span>
          </a>
          <div className="flex items-center gap-1 sm:gap-6">
            <a href="#how" className="hidden sm:block font-mono text-[12px] text-ink2 hover:text-ink transition-colors">
              Mechanism
            </a>
            <a href="#proof" className="hidden sm:block font-mono text-[12px] text-ink2 hover:text-ink transition-colors">
              Backtest
            </a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1.5 font-mono text-[12px] text-ink2 hover:text-ink transition-colors">
              <Github size={13} /> GitHub
            </a>
            <a href={DEMO} className="flex items-center gap-1.5 font-mono text-[12px] border border-line2 text-ink px-3 h-8 hover:border-risk hover:text-risk transition-colors">
              Launch terminal <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative border-b border-line umbra-field-r overflow-hidden">
        <div className="absolute inset-0 blueprint opacity-70 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 pt-32 pb-16 md:pt-40 md:pb-24 relative">
          {/* instrument readout header */}
          <div className="font-mono text-[10px] text-ink4 mb-10 flex flex-wrap gap-x-7 gap-y-1 tracking-wide">
            <span>ETH GLOBAL LISBON · 2026</span>
            <span>THE GRAPH / 0G / 1INCH</span>
            <span className="text-risk">◐ SYSTEM ARMED</span>
          </div>

          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-x-12 gap-y-14 items-center">
            {/* copy */}
            <div>
              <h1 className="font-display font-bold leading-[0.96] tracking-[-0.025em] text-[44px] sm:text-[60px] md:text-[70px]">
                The shadow
                <br />
                that guards
                <br />
                your <span className="text-risk">funds.</span>
              </h1>
              <p className="mt-7 text-ink2 text-[15px] md:text-base leading-relaxed max-w-lg">
                Umbra is the <span className="text-ink">autonomous circuit breaker</span>{" "}
                for DeFi. It prices systemic risk in real time — one index,{" "}
                <span className="text-ink">0 to 100</span> — and evacuates your
                position to safety <span className="text-ink">before</span> the
                pool collapses into totality.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href={DEMO} className="group flex items-center gap-2 bg-risk text-umbra font-mono text-sm px-5 h-11 hover:bg-corona hover:text-umbra transition-colors">
                  View demo
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a href={GITHUB} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-line2 text-ink font-mono text-sm px-5 h-11 hover:border-ink3 transition-colors">
                  <Github size={15} /> View GitHub repo
                </a>
              </div>

              <div className="mt-10 pt-6 border-t border-line flex items-center gap-3 font-mono text-[11px] text-ink3">
                <MiniEclipse p={1} color="#35c07a" size={15} />
                Backtested on the real USDC depeg (SVB, Mar 2023) —{" "}
                <span className="text-ink">+$126.9k saved</span> on $1M.
              </div>
            </div>

            {/* the eclipse instrument */}
            <div className="relative">
              <EclipseGauge />
              <div className="mt-3 font-mono text-[10px] text-ink4 flex justify-between">
                <span>fig.01 — risk as an eclipse</span>
                <span>SAFE → PENUMBRA → TOTALITY</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MARQUEE — instrument tape */}
      <div className="border-b border-line bg-umbra-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center shrink-0 font-mono text-[11px] py-2.5">
              {[
                ["USDC/SVB DEPEG", "$0.8726 trough"],
                ["UMBRA EXIT", "$1.0000"],
                ["FUNDS SAVED", "+$126,900"],
                ["OPTIMAL τ*", "66"],
                ["EVAC SLIPPAGE", "~5 bps"],
                ["POSITION", "$1,000,000"],
                ["DATA", "The Graph"],
                ["INFRA", "0G"],
                ["EXECUTION", "1inch"],
              ].map(([a, b], i) => (
                <span key={i} className="flex items-center">
                  <span className="text-ink4 ml-9">/</span>
                  <span className="text-ink3 ml-3">{a}</span>
                  <span className="text-ink ml-2">{b}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <Reveal>
            <SectionTag n="01" p={0.2}>The problem</SectionTag>
            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
              <h2 className="font-display font-semibold text-[30px] md:text-[42px] leading-[1.04] tracking-[-0.015em]">
                When a pool breaks, the average user finds out{" "}
                <span className="text-risk">too late</span>.
              </h2>
              <p className="text-ink2 leading-relaxed text-[15px]">
                By the time a human notices a depeg or a liquidity run, the
                liquidity has already evaporated and exit slippage has exploded.
                Panic-selling into a dead pool is how the losses actually
                happen — not the depeg itself. The market doesn&apos;t wait for
                you to read the chart.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line mt-12 border border-line">
              {[
                ["$3.3B", "USDC exposure · SVB, Mar 2023"],
                ["$40B+", "Terra / UST collapse, May 2022"],
                ["-27%", "USDC low over the SVB weekend"],
                ["minutes", "how fast v3 liquidity drained"],
              ].map(([v, l]) => (
                <div key={l} className="bg-umbra p-5">
                  <div className="font-mono tabular-nums text-2xl md:text-3xl text-ink">
                    {v}
                  </div>
                  <div className="label mt-2 leading-relaxed">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b border-line relative">
        <div className="absolute inset-0 blueprint-fine pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28 relative">
          <Reveal>
            <SectionTag n="02" p={0.5} color="#f2a93b">The mechanism</SectionTag>
            <h2 className="font-display font-semibold text-[30px] md:text-[42px] leading-[1.04] tracking-[-0.015em] max-w-2xl">
              One index. One threshold.
              One <span className="text-risk">automated</span> exit.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-line mt-14 border border-line">
            {[
              {
                phase: "monitor" as const,
                n: "01",
                t: "Monitor",
                d: "Umbra streams tick-level swaps, liquidity events and price from Uniswap v3 via The Graph — continuously, on-chain.",
                tag: "The Graph",
              },
              {
                phase: "score" as const,
                n: "02",
                t: "Score",
                d: "Three signals — liquidity flight, order-flow imbalance, price divergence — fuse into the CBRI (0–100) through a Noisy-OR model.",
                tag: "CBRI · 0G",
              },
              {
                phase: "evacuate" as const,
                n: "03",
                t: "Evacuate",
                d: "The instant CBRI crosses the optimal threshold τ*, Umbra routes a best-execution exit to a safe stablecoin through 1inch.",
                tag: "1inch",
              },
            ].map(({ phase, n, t, d, tag }, i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="bg-umbra p-7 h-full tick-frame group hover:bg-penumbra/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <EclipseGlyph phase={phase} size={26} />
                    <span className="font-mono text-[11px] text-ink4">{n}</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl mt-6">{t}</h3>
                  <p className="text-ink2 text-[14px] leading-relaxed mt-3">{d}</p>
                  <div className="mt-5 inline-block font-mono text-[10px] tracking-[0.1em] uppercase text-ink3 border border-line2 px-2 py-1">
                    {tag}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80}>
            <div className="mt-10 border border-line p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between bg-umbra-2/50">
              <div>
                <div className="label mb-2">The model · CBRI</div>
                <div className="font-mono text-lg md:text-xl text-ink">
                  CBRI = 100 · (1 − ∏
                  <span className="text-ink3">(1 − wᵢ·sᵢ)</span>)
                </div>
              </div>
              <p className="text-ink2 text-[14px] leading-relaxed max-w-md">
                A weighted Noisy-OR: any single signal spiking is enough to raise
                the alarm. Weights down-rank signals that aren&apos;t
                discriminative on a given crash — the model stays honest, not
                loud.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof" className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <Reveal>
            <SectionTag n="03" p={0.9} color="#ff2233">The proof · backtest</SectionTag>
            <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-end">
              <h2 className="font-display font-semibold text-[30px] md:text-[42px] leading-[1.04] tracking-[-0.015em]">
                Replayed on the real crash. Umbra exits at{" "}
                <span className="text-safe">$1.0000</span> — the depeg bottomed
                at <span className="text-risk">$0.873</span>.
              </h2>
              <p className="text-ink2 text-[15px] leading-relaxed">
                We replayed the USDC/SVB depeg candle-by-candle against real
                on-chain liquidity. The optimal threshold τ* isn&apos;t guessed —
                it&apos;s the point that{" "}
                <span className="text-ink">maximises net funds saved</span> with
                zero false alarms in calm markets. Umbra fires once, early, and
                gets out clean.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
              <Metric value="66" label="Optimal threshold τ*" tone="risk" />
              <Metric value="$1.0000" label="Umbra exit price" tone="safe" />
              <Metric value="+$126.9k" label="Funds saved on $1M" tone="safe" />
              <Metric value="~5 bps" label="Evacuation slippage" />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-4 border border-line bg-penumbra/40 p-5 tick-frame">
              <div className="flex items-center justify-between mb-4">
                <span className="label">USDC / USD · SVB weekend · raw</span>
                <span className="font-mono text-[10px] text-ink3">10–13 Mar 2023</span>
              </div>
              <DepegChart />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 font-mono text-[10px] text-ink3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-[2px] bg-[#cfc7b5]" /> USDC price
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-safe" /> Umbra evacuation @ τ*
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-px bg-risk" /> depeg trough $0.873
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <a href={DEMO} className="group mt-10 inline-flex items-center gap-2 border border-line2 text-ink font-mono text-sm px-5 h-11 hover:border-risk hover:text-risk transition-colors">
              Explore the live terminal
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* STACK */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <Reveal>
            <SectionTag n="04" p={0.05}>Built on</SectionTag>
            <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
              {[
                ["The Graph", "Data", "Tick-level Uniswap v3 history & real-time — swaps, liquidity, price."],
                ["0G", "Infra", "Decentralised storage & traceability of the risk model and CBRI scores."],
                ["1inch", "Execution", "Best-execution multi-DEX routing of the emergency evacuation."],
              ].map(([name, role, desc]) => (
                <div key={name} className="bg-umbra p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display font-bold text-xl">{name}</span>
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-risk">
                      {role}
                    </span>
                  </div>
                  <p className="text-ink3 text-[13px] leading-relaxed mt-3">{desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b border-line umbra-field">
        <div className="max-w-6xl mx-auto px-5 py-24 md:py-32 text-center relative">
          <Reveal>
            <div className="animate-corona-breathe inline-block">
              <UmbraMark size={46} className="mx-auto" />
            </div>
            <h2 className="font-display font-bold text-[34px] md:text-[54px] leading-[1.0] tracking-[-0.025em] mt-8">
              See it break.
              <br />
              Then see it <span className="text-safe">save</span>.
            </h2>
            <p className="text-ink2 mt-6 max-w-lg mx-auto text-[15px] leading-relaxed">
              Watch the risk index climb from calm to critical — and Umbra pull
              the funds out at the exact right second.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href={DEMO} className="group flex items-center gap-2 bg-risk text-umbra font-mono text-sm px-6 h-12 hover:bg-corona hover:text-umbra transition-colors">
                Launch the terminal
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-line2 font-mono text-sm px-6 h-12 hover:border-ink3 transition-colors">
                <Github size={16} /> GitHub repo
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink3">
          <UmbraMark size={16} />
          UMBRA — the autonomous circuit breaker for DeFi
        </div>
        <div className="font-mono text-[10px] text-ink4 flex items-center gap-4">
          <span>ETH Global Lisbon 2026</span>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-ink2 flex items-center gap-1">
            source <ArrowUpRight size={11} />
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ── static raw depeg chart (SVG, no smoothing) ─────────────── */

function DepegChart() {
  const pts = [
    1.0, 1.0, 1.0, 0.999, 1.0, 0.998, 0.999, 0.997, 0.985, 0.96, 0.935, 0.905,
    0.882, 0.873, 0.89, 0.912, 0.94, 0.965, 0.984, 0.995, 0.999, 1.0,
  ];
  const W = 900;
  const H = 150;
  const lo = 0.86;
  const hi = 1.008;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const line = pts.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const evacIdx = 7;
  const troughV = 0.873;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-40">
      <line x1="0" y1={y(1)} x2={W} y2={y(1)} stroke="#423d34" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="0" y1={y(troughV)} x2={W} y2={y(troughV)} stroke="#ff2233" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
      <polygon points={`0,${H} ${line} ${W},${H}`} fill="#ece6d8" opacity="0.04" />
      <polyline points={line} fill="none" stroke="#cfc7b5" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      <line x1={x(evacIdx)} y1="0" x2={x(evacIdx)} y2={H} stroke="#35c07a" strokeWidth="1" opacity="0.5" />
      <circle cx={x(evacIdx)} cy={y(pts[evacIdx])} r="5" fill="#35c07a" stroke="#050505" strokeWidth="2" />
      <text x={x(evacIdx) + 8} y={y(pts[evacIdx]) - 8} fontSize="11" fill="#35c07a" fontFamily="var(--font-mono)">
        EVAC $1.0000
      </text>
      <text x={W - 6} y={y(troughV) + 14} textAnchor="end" fontSize="10" fill="#ff2233" fontFamily="var(--font-mono)">
        trough $0.873
      </text>
    </svg>
  );
}
