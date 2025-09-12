module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f766e',   // Teal
        accent: '#f97316',    // Orange
        danger: '#dc2626',    // Red
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        toastSlideIn: {
          '0%': { transform: 'translateX(100%) scale(0.9)', opacity: '0' },
          '80%': { transform: 'translateX(-10%) scale(1.02)', opacity: '1' },
          '100%': { transform: 'translateX(0) scale(1)' },
        },
        toastSlideOut: {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(100%) scale(0.9)', opacity: '0' },
        },
      },
      animation: {
        toastSlideIn: 'toastSlideIn 0.6s forwards',
        toastSlideOut: 'toastSlideOut 0.4s forwards',
      },
    },
  },
  plugins: [],
}
