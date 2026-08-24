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
        background: '#0B0C10',
        card: '#13151C',
        'card-hover': '#1A1D27',
        border: '#232733',
        slate: {
          950: '#0B0C10',
          900: '#13151C',
          800: '#1D212B',
          700: '#2A303F',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
      },
    },
  },
  plugins: [],
};
