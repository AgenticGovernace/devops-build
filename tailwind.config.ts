import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          border: 'var(--color-brand-border)',
          'text-primary': 'var(--color-brand-text-primary)',
          'text-secondary': 'var(--color-brand-text-secondary)',
          accent: 'var(--color-brand-accent)',
          'accent-hover': 'var(--color-brand-accent-hover)',
          success: 'var(--color-brand-success)',
          danger: 'var(--color-brand-danger)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
