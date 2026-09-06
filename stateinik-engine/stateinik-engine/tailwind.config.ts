import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/**
 * Default "warm dark" theme. These token names are referenced by every block
 * and component — to re-theme the engine, change the values here (and the
 * matching CSS variables in src/app/globals.css). The token *names* are the
 * stable contract; the values are yours to own.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#141413",
        "bg-card": "#1b1a19",
        "bg-card-hover": "#222120",
        "bg-section": "#191817",
        border: "#282624",
        "border-hover": "#3a3734",
        text: "#ede9e3",
        "text-sub": "#a8a29e",
        "text-dim": "#6b6560",
        accent: "#d97757",
        "accent-hover": "#e5896a",
        "accent-soft": "rgba(217,119,87,0.10)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        head: ["var(--font-serif)", "Lora", "Georgia", "serif"],
      },
      maxWidth: {
        content: "1060px",
        narrow: "700px",
      },
    },
  },
  plugins: [typography],
};
export default config;
