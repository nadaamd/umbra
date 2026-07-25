/** Custom eclipse-derived glyphs — one per step of the breaker's loop. */
export function EclipseGlyph({
  phase,
  size = 26,
}: {
  phase: "monitor" | "score" | "evacuate";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 26 26",
    fill: "none" as const,
  };

  if (phase === "monitor") {
    // continuous watch — an aperture of concentric coronae
    return (
      <svg {...common} aria-hidden>
        <circle cx="13" cy="13" r="9.5" stroke="#bfc3ba" strokeWidth="1.1" opacity="0.35" />
        <circle cx="13" cy="13" r="6" stroke="#bfc3ba" strokeWidth="1.1" strokeDasharray="2.5 3" />
        <circle cx="13" cy="13" r="2.1" fill="#bfc3ba" />
      </svg>
    );
  }

  if (phase === "score") {
    // the index forming — a partial eclipse crescent
    return (
      <svg {...common} aria-hidden>
        <mask id="score-ec">
          <rect width="26" height="26" fill="#fff" />
          <circle cx="16.5" cy="11" r="8.5" fill="#000" />
        </mask>
        <circle cx="13" cy="13" r="8.3" fill="#a9aca9" mask="url(#score-ec)" />
        <circle cx="13" cy="13" r="9.3" stroke="#bfc3ba" strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }

  // evacuate — totality with red prominences + an exit vector
  return (
    <svg {...common} aria-hidden>
      <circle cx="11.5" cy="13" r="7.6" fill="#2f2235" stroke="#bfc3ba" strokeWidth="1.3" />
      {[35, 150, 300].map((a) => {
        const r = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={11.5 + Math.cos(r) * 7.6}
            y1={13 + Math.sin(r) * 7.6}
            x2={11.5 + Math.cos(r) * 10}
            y2={13 + Math.sin(r) * 10}
            stroke="#bfc3ba"
            strokeWidth="1.2"
          />
        );
      })}
      <path d="M18 13 h5 m-2.5 -2.5 L23 13 l-2.5 2.5" stroke="#60495a" strokeWidth="1.3" strokeLinecap="square" fill="none" />
    </svg>
  );
}
