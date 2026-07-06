import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2f241b",
        coffee: "#5c3b25",
        clay: "#b66a3c",
        terracotta: "#d9824b",
        sand: "#f4dfbc",
        paper: "#fff8ea",
        cork: "#c7915a",
        moss: "#677a3f",
        sea: "#315f67",
        sunset: "#f4b35e"
      },
      boxShadow: {
        paper: "0 18px 45px rgba(77, 45, 25, 0.16)",
        pin: "0 12px 28px rgba(89, 49, 24, 0.22)"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"]
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at 20% 10%, rgba(255,255,255,.75), transparent 20rem), linear-gradient(135deg, rgba(255,248,234,.95), rgba(246,222,185,.88))",
        cork:
          "radial-gradient(circle at 1px 1px, rgba(92,59,37,.24) 1px, transparent 0), linear-gradient(135deg, #c8955e, #b77a45)"
      }
    }
  },
  plugins: []
};

export default config;
