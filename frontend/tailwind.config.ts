import type { Config } from "tailwindcss";

/**
 * CircuitBreaker.ai — "Institutional Terminal" design tokens.
 * Dark-committed (a risk terminal is dark by design). Functional colors only:
 * risk / safe / armed status hues, a CVD-validated categorical trio, technical greys.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Eclipse shadow-depth scale (deepest → lightest) ──────────────
        // The whole surface language is one eclipse: total shadow at the
        // core, warming toward the corona of light at the edge of vision.
        umbra: "#050505", // total shadow — base
        "umbra-2": "#0a0908", // shadow, warmed
        penumbra: "#100e0c", // partial shadow — panels
        "penumbra-2": "#17140f", // raised partial shadow
        antumbra: "#211e19", // faint outer edge — hairlines
        "antumbra-2": "#302c24", // stronger edge
        corona: "#ece6d8", // the light — warm ivory (eclipse corona)
        // Aliases kept so existing components resolve to the eclipse scale
        bg: "#050505",
        void: "#050505",
        panel: "#0a0908",
        panel2: "#100e0c",
        raised: "#17140f",
        line: "#211e19",
        line2: "#302c24",
        // Ink = graded corona light
        ink: "#ece6d8",
        ink2: "#a49b8b",
        ink3: "#6a6357",
        ink4: "#423d34",
        // Reserved status — red prominence is the crisis corona
        risk: "#ff2233",
        signal: "#ff2233",
        "risk-dim": "#7a151d",
        safe: "#35c07a",
        "safe-dim": "#1c5f42",
        armed: "#f2a93b",
        "armed-dim": "#7a5511",
        // CVD-validated categorical trio (sub-signal decomposition) — all-pairs PASS
        s1: "#3987e5", // blue
        s2: "#d95926", // orange
        s3: "#199e70", // aqua
        // Grid / chart chrome
        grid: "#1a1e23",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-mono)", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "13px", letterSpacing: "0.04em" }],
        micro: ["11px", { lineHeight: "14px" }],
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(255,34,51,0.18)" },
          "100%": { backgroundColor: "transparent" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "corona-breathe": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.015)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        scan: "scan 4s linear infinite",
        flash: "flash 1.1s ease-out",
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "corona-breathe": "corona-breathe 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
