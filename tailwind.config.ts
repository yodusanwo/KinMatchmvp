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
        xs: ['1rem', { lineHeight: '1.125rem' }],        // 16px (was 12px originally, +4px total)
        sm: ['1.125rem', { lineHeight: '1.375rem' }],    // 18px (was 14px originally, +4px total)
        base: ['1.25rem', { lineHeight: '1.625rem' }],   // 20px (was 16px originally, +4px total)
        lg: ['1.375rem', { lineHeight: '1.875rem' }],    // 22px (was 18px originally, +4px total)
        xl: ['1.5rem', { lineHeight: '1.875rem' }],      // 24px (was 20px originally, +4px total)
        '2xl': ['1.75rem', { lineHeight: '2.125rem' }],  // 28px (was 24px originally, +4px total)
        '3xl': ['2.125rem', { lineHeight: '2.375rem' }], // 34px (was 30px originally, +4px total)
        '4xl': ['2.625rem', { lineHeight: '2.75rem' }],  // 42px (was 36px originally, +6px total)
      },
    },
  },
} satisfies Config;

export default config;
