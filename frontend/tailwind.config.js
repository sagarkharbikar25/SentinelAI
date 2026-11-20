/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        card: 'var(--surface)',
        well: 'var(--well)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        border: 'var(--line)',
        'border-strong': 'var(--line-strong)',
        'border-subtle': 'var(--line)',
        'border-hover': 'var(--line-strong)',

        ink: {
          1: 'var(--ink-1)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          DEFAULT: 'var(--ink-1)',
        },
        'text-primary': 'var(--ink-1)',
        'text-secondary': 'var(--ink-2)',
        'text-muted': 'var(--ink-3)',

        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          soft: 'var(--brand-soft)',
          ink: 'var(--brand-ink)',
        },
        sky: 'var(--sky)',

        safe: {
          DEFAULT: 'var(--safe)',
          ink: 'var(--safe-ink)',
          soft: 'var(--safe-soft)',
        },
        caution: {
          DEFAULT: 'var(--caution)',
          ink: 'var(--caution-ink)',
          soft: 'var(--caution-soft)',
        },
        high: {
          DEFAULT: 'var(--high)',
          ink: 'var(--high-ink)',
          soft: 'var(--high-soft)',
        },
        critical: {
          DEFAULT: 'var(--critical)',
          ink: 'var(--critical-ink)',
          soft: 'var(--critical-soft)',
        },
        ai: {
          DEFAULT: 'var(--ai)',
          ink: 'var(--ai-ink)',
          soft: 'var(--ai-soft)',
        },
        lime: 'var(--lime)',

        // Semantic compatibility aliases
        accent: {
          DEFAULT: 'var(--brand)',
          emerald: 'var(--safe)',
          amber: 'var(--caution)',
          rose: 'var(--critical)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
        well: 'var(--radius-well)',
        pill: 'var(--radius-pill)',
        action: 'var(--radius-action)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      backgroundImage: {
        'gradient-sky': 'var(--gradient-sky)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Chivo', 'sans-serif'],
        heading: ['"Barlow Condensed"', 'Chivo', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
