import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        faint: "rgb(var(--color-faint) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          darker: "rgb(var(--color-primary-darker) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
        },
        cyan: {
          DEFAULT: "rgb(var(--color-cyan) / <alpha-value>)",
          dark: "rgb(var(--color-cyan-dark) / <alpha-value>)",
          light: "rgb(var(--color-cyan-light) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          light: "rgb(var(--color-accent-light) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          light: "rgb(var(--color-success-light) / <alpha-value>)",
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
        "brand-gradient-soft": "linear-gradient(135deg, rgb(var(--color-primary-light)) 0%, rgb(var(--color-cyan-light)) 100%)",
        "hero-radial":
          "radial-gradient(60% 60% at 15% 20%, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 60%), radial-gradient(50% 50% at 90% 10%, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0) 60%)",
      },
    },
  },
  plugins: [],
};
export default config;