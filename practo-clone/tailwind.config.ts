import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F9FC",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#64748B",
        faint: "#94A3B8",
        line: "#E2E8F0",
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          darker: "#1E3A8A",
          light: "#EFF6FF",
        },
        cyan: {
          DEFAULT: "#06B6D4",
          dark: "#0E7490",
          light: "#ECFEFF",
        },
        accent: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
        },
        success: {
          DEFAULT: "#059669",
          light: "#ECFDF5",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "26px",
      },
      maxWidth: {
        content: "1180px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -12px rgba(15, 23, 42, 0.12)",
        card: "0 1px 2px rgba(15, 23, 42, 0.03), 0 1px 0 rgba(15, 23, 42, 0.03)",
        "card-hover": "0 16px 32px -16px rgba(37, 99, 235, 0.28)",
        glow: "0 8px 24px -6px rgba(37, 99, 235, 0.45)",
        nav: "0 1px 0 rgba(15, 23, 42, 0.04), 0 8px 24px -18px rgba(15, 23, 42, 0.25)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2563EB 0%, #0EA5E9 55%, #06B6D4 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #EFF6FF 0%, #ECFEFF 100%)",
        "hero-radial":
          "radial-gradient(60% 60% at 15% 20%, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 60%), radial-gradient(50% 50% at 90% 10%, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0) 60%)",
      },
    },
  },
  plugins: [],
};
export default config;