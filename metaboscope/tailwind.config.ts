import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f1e33',
          800: '#1e3a5f',
          700: '#1e4976',
          600: '#27598c',
        },
        teal: {
          700: '#0b7d72',
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
