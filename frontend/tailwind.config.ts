import type { Config } from "tailwindcss";

/**
 * Umbra — "Institutional Terminal" design tokens.
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
        // ── Eclipse scale, re-toned to the Mauve/Violet palette ──────────
        // Midnight Violet (core shadow) → Vintage Grape → Mauve Shadow,
        // lightening to Silver and Ash Grey at the corona of light.
        umbra: "#2f2235", // Midnight Violet — base
        "umbra-2": "#271b2d", // deeper, for tapes/insets
        penumbra: "#372a3d", // partial shadow — panels
        "penumbra-2": "#3f3244", // Vintage Grape — raised partial shadow
        antumbra: "#493c50", // faint edge — hairlines
        "antumbra-2": "#60495a", // Mauve Shadow — stronger edge
        corona: "#bfc3ba", // Ash Grey — the light
        // Palette, named
        ash: "#bfc3ba",
        silver: "#a9aca9",
        mauve: "#60495a",
        grape: "#3f3244",
        violet: "#2f2235",
        // Aliases so existing components resolve to the palette
        bg: "#2f2235",
        void: "#2f2235",
        panel: "#3f3244",
        panel2: "#372a3d",
        raised: "#4a3b52",
        line: "#493c50",
        line2: "#60495a",
        // Ink = graded light (Ash Grey → Silver → muted mauve-grey)
        ink: "#bfc3ba",
        ink2: "#a9aca9",
        ink3: "#837e88",
        ink4: "#5e5266",
        // Status, expressed in palette tones only (brightness = severity).
        // Never color-alone — badges always carry an icon + label.
        risk: "#bfc3ba", // Ash — alert "lights up" brightest
        signal: "#bfc3ba",
        "risk-dim": "#837e88",
        safe: "#a9aca9", // Silver — readable, calm
        "safe-dim": "#5e5266",
        armed: "#60495a", // Mauve — mid, recedes
        "armed-dim": "#5e5266",
        // CVD-validated categorical trio (sub-signal decomposition) — all-pairs PASS
        s1: "#a9aca9", // silver
        s2: "#60495a", // mauve
        s3: "#837e88", // muted
        // Grid / chart chrome
        grid: "#3a2c43",
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
