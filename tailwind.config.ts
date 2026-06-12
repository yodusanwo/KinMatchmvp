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
        // One family across the system; Inter substitutes for Airbnb Cereal VF.
        sans: ["var(--font-inter)", "Circular", "-apple-system", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "Circular", "-apple-system", "system-ui", "sans-serif"],
      },
      // Airbnb shape language: soft everywhere, no hard corners. Buttons 8px,
      // cards ~14–24px, pills/orbs/avatars fully round.
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "8px",
        DEFAULT: "8px",
        md: "14px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
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
