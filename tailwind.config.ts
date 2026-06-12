import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-deep": "var(--cream-deep)",
        "surface-dark": "var(--surface-dark)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-strong": "var(--surface-strong)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        body: "var(--body)",
        terracotta: "var(--terracotta)",
        "terracotta-deep": "var(--terracotta-deep)",
        hairline: "var(--hairline)",
        "hairline-soft": "var(--hairline-soft)",
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
        // Inter substitutes for Helvetica Now (UI workhorse).
        sans: ["var(--font-inter)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        inter: ["var(--font-inter)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        // Bebas Neue stands in for Nike Futura ND — campaign display tier only.
        display: ["var(--font-bebas)", "Helvetica Neue", "Impact", "sans-serif"],
      },
      // Nike shape vocabulary: cards/containers are 0-radius and flat; the only
      // rounding is the CTA pill (full) and the search input (md, 24px).
      borderRadius: {
        none: "0px",
        xs: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "24px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
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
