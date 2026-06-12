import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-deep": "var(--cream-deep)",
        "surface-dark": "var(--surface-dark)",
        "surface-elevated": "var(--surface-elevated)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        terracotta: "var(--terracotta)",
        "terracotta-deep": "var(--terracotta-deep)",
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        mute: "var(--mute)",
        stone: "var(--stone)",
        ash: "var(--ash)",
        "link-blue": "var(--link-blue)",
        error: "var(--error)",
        warning: "var(--warning)",
        "success-deep": "var(--success-deep)",
        forest: "var(--forest)",
        sage: "var(--sage)",
        mustard: "var(--mustard)",
        honey: "var(--honey)",
      },
      fontFamily: {
        // One family across the system; Inter substitutes for NVIDIA-EMEA.
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
        inter: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
      },
      // NVIDIA geometry: aggressively angular. Everything that isn't a circle
      // collapses to a 2px radius. `full` is preserved for avatars/icon dots.
      borderRadius: {
        none: "0px",
        xs: "1px",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        "2xl": "2px",
        "3xl": "2px",
        full: "9999px",
      },
      fontSize: {
        xs: ["1rem", { lineHeight: "1.125rem" }],
        sm: ["1.125rem", { lineHeight: "1.375rem" }],
        base: ["1.25rem", { lineHeight: "1.625rem" }],
        lg: ["1.375rem", { lineHeight: "1.875rem" }],
        xl: ["1.5rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.125rem" }],
        "3xl": ["2.125rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.625rem", { lineHeight: "2.75rem" }],
      },
    },
  },
} satisfies Config;

export default config;
