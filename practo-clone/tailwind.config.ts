import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
           colors: {
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#64748B",
        faint: "#94A3B8",
        line: "#E2E8F0",
        primary: {
          DEFAULT: "#0F766E",
          dark: "#115E59",
          light: "#CCFBF1",
        },
        info: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE",
        },
        accent: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};
export default config;