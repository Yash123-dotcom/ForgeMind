import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080A08",
        surface: {
          DEFAULT: "#0D100D",
          elevated: "#131713",
          hover: "#1A1F1A",
          muted: "#181D18",
        },
        foreground: {
          DEFAULT: "#F2F2ED",
          secondary: "#92978F",
          muted: "#666B63",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.05)",
          active: "rgba(255, 255, 255, 0.18)",
        },
        brand: {
          DEFAULT: "#12A873",
          light: "#16C788",
          dark: "#0D7F56",
          subtle: "rgba(18, 168, 115, 0.12)",
        },
        severity: {
          info: "#4E97FF",
          low: "#34D399",
          medium: "#E2AD54",
          high: "#F97316",
          critical: "#EF7770",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "Fira Code",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;

