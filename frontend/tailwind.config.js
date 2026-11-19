/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#08090C',
        surface: '#0D1017',
        card: '#131722',
        'card-hover': '#1A202E',
        border: '#1E2536',
        cyber: {
          cyan: '#00E5FF',
          teal: '#14B8A6',
          amber: '#F59E0B',
          crimson: '#EF4444',
          silver: '#8A94A6',
        },
        slate: {
          950: '#08090C',
          900: '#0D1017',
          800: '#131722',
          700: '#1E2536',
          600: '#333D52',
          400: '#8A94A6',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        heading: ['Chivo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
