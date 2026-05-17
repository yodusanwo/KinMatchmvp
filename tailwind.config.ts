import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-deep": "var(--cream-deep)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        terracotta: "var(--terracotta)",
        "terracotta-deep": "var(--terracotta-deep)",
        forest: "var(--forest)",
        sage: "var(--sage)",
        mustard: "var(--mustard)",
        honey: "var(--honey)",
      },
      fontFamily: {
        sans: ["var(--font-instrument-sans)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
} satisfies Config;

export default config;
