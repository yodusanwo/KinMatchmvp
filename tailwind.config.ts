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
        // System tokens
        canvas: "var(--canvas)",
        carbon: "var(--carbon)",
        hero: "var(--hero)",
        "hero-meta": "var(--hero-meta)",
        constellation: "var(--constellation)",
        eyebrow: "var(--eyebrow)",
        slate: "var(--slate)",
        "burnt-orange": "var(--burnt-orange)",
        "nav-active": "var(--nav-active)",
        "nav-inactive": "var(--nav-inactive)",
        signal: "var(--signal)",
        lavender: "var(--lavender)",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "Liberation Sans", "sans-serif"],
        inter: ["Arial", "Helvetica", "Liberation Sans", "sans-serif"],
        // Archivo Black carries the heavy display headings + wordmark.
        display: ["var(--font-archivo-black)", "Arial Black", "Arial", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        DEFAULT: "4px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
        "3xl": "20px",
        full: "9999px",
      },
    },
  },
} satisfies Config;

export default config;
