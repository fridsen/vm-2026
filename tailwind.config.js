/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Page background colour (the soft periwinkle "screen body").
        canvas: 'var(--page-bg)',
        // White cards and elevated surfaces.
        surface: 'var(--color-white)',
        'surface-2': '#F5F6FC',
        // The atmosphere ring around the phone-frame preview.
        atmosphere: 'var(--bg-atmosphere)',

        // Brand accent — solid near-black ink. Anything wearing the
        // `accent` background gets white text via `accent.foreground`.
        accent: {
          DEFAULT: 'var(--color-accent)',
          dark: 'var(--color-black)',
          foreground: 'var(--color-white)',
        },

        // "Pitch" ramp — repurposed as a navy → ink scale. Old class
        // names still resolve, but now read as monochrome instead of lime.
        // pitch-50…200 are subtle ink tints (light backgrounds, dividers);
        // pitch-500 is the primary emphasis ink colour.
        pitch: {
          50: '#F0F1F8',
          100: '#EAECF8',
          200: '#E0E2EE',
          300: '#C0C3D8',
          400: '#6B6E88',
          500: 'var(--color-body)',
          600: 'var(--color-accent)',
          700: '#06060B',
        },

        // Prediction-sheet design tokens (scoped to the redesigned sheet).
        ink: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          faint: 'var(--text-tertiary)',
        },
        sheet: 'var(--bg-container)',
        'submit-disabled': '#9E9EA1',

        // Onboarding flow accent (signup/login/payment screens).
        lime: 'var(--color-lime)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Bebas Neue', 'DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        bebas: ['Bebas Neue', 'system-ui', 'sans-serif'],
        barlow: ['Barlow', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        float: '0 24px 48px -18px rgba(0, 0, 0, 0.12), 0 12px 24px -12px rgba(0, 0, 0, 0.06)',
        card: '0 2px 14px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        nav: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
