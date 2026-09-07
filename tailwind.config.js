/** @type {import('tailwindcss').Config} */

/** Wrap a token so Tailwind's `/opacity` modifiers still work. */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: token('--color-canvas'),
        surface: {
          DEFAULT: token('--color-surface'),
          muted: token('--color-surface-muted'),
        },
        border: token('--color-border'),
        content: {
          DEFAULT: token('--color-content'),
          muted: token('--color-content-muted'),
          subtle: token('--color-content-subtle'),
        },
        brand: {
          50: token('--color-brand-50'),
          100: token('--color-brand-100'),
          500: token('--color-brand-500'),
          600: token('--color-brand-600'),
          700: token('--color-brand-700'),
        },
      },
    },
  },
  plugins: [],
};
