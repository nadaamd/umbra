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
        // Surfaces (near-black, warm-neutral — never pure #000)
        bg: "#08090a",
        panel: "#0e1013",
        panel2: "#14171b",
        raised: "#181c21",
        // Hairline structure
        line: "#1e2329",
        line2: "#282e36",
        // Ink
        ink: "#e6e8ea",
        ink2: "#9aa0a6",
        ink3: "#626871",
        ink4: "#3c424a",
        // Reserved status (each ships with icon + label, never color-alone)
        risk: "#e5484d",
        "risk-dim": "#7a2b2e",
        safe: "#30a46c",
        "safe-dim": "#1c5f42",
        armed: "#f5a623",
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
          "0%": { backgroundColor: "rgba(229,72,77,0.18)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        scan: "scan 4s linear infinite",
        flash: "flash 1.1s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
