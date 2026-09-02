import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
                 colors: {
        bg: "#FAFAFA",
        surface: "#FFFFFF",
        ink: "#111827",
        muted: "#6B7280",
        faint: "#9CA3AF",
        line: "#E5E7EB",
        primary: {
          DEFAULT: "#4F46E5",
          dark: "#4338CA",
          light: "#EEF2FF",
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