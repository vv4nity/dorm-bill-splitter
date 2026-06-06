import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#FBF8F2",
          100: "#F5EFE3",
          200: "#E8DEC8",
        },
        ink: {
          900: "#16140F",
          800: "#2A2620",
          700: "#4A4339",
          500: "#7A6F60",
          400: "#9B907F",
        },
        forest: {
          600: "#1F5A4A",
          700: "#164336",
          800: "#0F2F26",
        },
        amber: {
          tint: "#FCE7B5",
          mid: "#D97706",
        },
        ocean: {
          tint: "#C7DDF0",
          mid: "#0369A1",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(22, 20, 15, 0.03)",
        card: "0 1px 2px rgba(22, 20, 15, 0.04), 0 4px 16px rgba(22, 20, 15, 0.06)",
        elevated:
          "0 1px 2px rgba(22, 20, 15, 0.04), 0 8px 24px -6px rgba(22, 20, 15, 0.10), 0 16px 48px -12px rgba(22, 20, 15, 0.10)",
        float:
          "0 2px 4px rgba(22, 20, 15, 0.04), 0 12px 32px -8px rgba(22, 20, 15, 0.16), 0 24px 64px -16px rgba(15, 47, 38, 0.14)",
        glow: "0 0 0 1px rgba(31, 90, 74, 0.08), 0 8px 28px -8px rgba(31, 90, 74, 0.28)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
      },
      backgroundImage: {
        "forest-grad": "linear-gradient(135deg, #1F5A4A 0%, #0F2F26 100%)",
        "ink-grad": "linear-gradient(140deg, #2A2620 0%, #16140F 100%)",
        "amber-grad": "linear-gradient(135deg, #FCE7B5 0%, #F5D98A 100%)",
        "ocean-grad": "linear-gradient(135deg, #C7DDF0 0%, #A9CCEB 100%)",
        sheen:
          "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.45) 50%, transparent 75%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
