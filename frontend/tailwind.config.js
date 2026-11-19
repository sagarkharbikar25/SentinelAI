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
        background: '#F6F8F6',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        'card-hover': '#F2F6F3',
        border: '#E2EAE4',
        forest: {
          950: '#0A0F0D',
          900: '#111915',
          800: '#1A2620',
          700: '#2D3A31',
          600: '#405045',
          500: '#536459',
          400: '#75887B',
          300: '#A4B5AA',
          200: '#D1DDD5',
          100: '#EAF0EB',
          50: '#F4F7F5',
        },
        mint: {
          900: '#064E3B',
          800: '#065F46',
          700: '#047857',
          600: '#059669',
          500: '#10B981',
          400: '#34D399',
          300: '#6EE7B7',
          200: '#A7F3D0',
          100: '#D1FAE5',
          50: '#ECFDF5',
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
