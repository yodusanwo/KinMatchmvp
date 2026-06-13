import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-deep": "var(--cream-deep)",
        "surface-dark": "var(--surface-dark)",
        "surface-elevated": "var(--surface-elevated)",
        surface: "var(--surface)",
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
        // Named Nintendo chrome tokens
        canvas: "var(--canvas)",
        periwinkle: "var(--periwinkle)",
        sky: "var(--sky)",
        lavender: "var(--lavender)",
        ice: "var(--ice)",
        "chrome-indigo": "var(--chrome-indigo)",
        "muted-indigo": "var(--muted-indigo)",
        platinum: "var(--platinum)",
        carbon: "var(--carbon)",
        signal: "var(--signal)",
        amber: "var(--amber)",
        "nav-gold": "var(--nav-gold)",
        "systems-teal": "var(--systems-teal)",
        "games-red": "var(--games-red)",
        "nintendo-red": "var(--nintendo-red)",
      },
      fontFamily: {
        // Arial / Helvetica is the era-authentic, webfont-free UI face.
        sans: ["Arial", "Helvetica", "Liberation Sans", "sans-serif"],
        inter: ["Arial", "Helvetica", "Liberation Sans", "sans-serif"],
        // Archivo Black stands in for Arial Black hero box-art wordmarks.
        display: ["var(--font-archivo-black)", "Arial Black", "Arial", "sans-serif"],
      },
      // Nintendo shape vocabulary: sharp/chamfered by default, with a small
      // graded scale; full roundness reserved for pills, radio dots, arrows.
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        DEFAULT: "2px",
        md: "6px",
        lg: "10px",
        xl: "10px",
        "2xl": "10px",
        "3xl": "10px",
        full: "9999px",
      },
      fontSize: {
        xs: ["0.6875rem", { lineHeight: "1.1" }],
        sm: ["0.75rem", { lineHeight: "1.4" }],
        base: ["0.8125rem", { lineHeight: "1.4" }],
        lg: ["0.9375rem", { lineHeight: "1.3" }],
        xl: ["1.125rem", { lineHeight: "1.2" }],
        "2xl": ["1.5rem", { lineHeight: "1.1" }],
        "3xl": ["2rem", { lineHeight: "1" }],
        "4xl": ["2.75rem", { lineHeight: "1" }],
      },
    },
  },
} satisfies Config;

export default config;
