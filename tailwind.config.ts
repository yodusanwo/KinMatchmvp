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
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1rem' }],        // 13px (was 12px)
        sm: ['0.9375rem', { lineHeight: '1.25rem' }],     // 15px (was 14px)
        base: ['1.0625rem', { lineHeight: '1.5rem' }],    // 17px (was 16px)
        lg: ['1.1875rem', { lineHeight: '1.75rem' }],     // 19px (was 18px)
        xl: ['1.3125rem', { lineHeight: '1.75rem' }],     // 21px (was 20px)
        '2xl': ['1.5625rem', { lineHeight: '2rem' }],     // 25px (was 24px)
        '3xl': ['1.9375rem', { lineHeight: '2.25rem' }],  // 31px (was 30px)
        '4xl': ['2.3125rem', { lineHeight: '2.5rem' }],   // 37px (was 36px)
      },
    },
  },
} satisfies Config;

export default config;
