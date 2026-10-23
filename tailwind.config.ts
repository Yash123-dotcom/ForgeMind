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
        background: "#F7F7F2",
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
          hover: "#EFF0E9",
          muted: "#F0F1EB",
        },
        foreground: {
          DEFAULT: "#191A23",
          secondary: "#55575E",
          muted: "#777970",
        },
        border: {
          DEFAULT: "rgba(25, 26, 35, 0.12)",
          subtle: "rgba(25, 26, 35, 0.07)",
          active: "rgba(25, 26, 35, 0.22)",
        },
        // Dark olive for readable text and icons.
        // Primary action surfaces use lime (#B9FF66).
        brand: {
          DEFAULT: "#628D30",
          light: "#B9FF66",
          dark: "#35541C",
          subtle: "rgba(98, 141, 48, 0.12)",
        },
        severity: {
          info: "#2563EB",
          low: "#267A4B",
          medium: "#946200",
          high: "#C2410C",
          critical: "#C2413A",
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