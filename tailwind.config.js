/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out both',
        'bounce-slow':  'bounceSlow 3s ease-in-out infinite',
        'float':        'float 4s ease-in-out infinite',
        'dropdown-in':  'dropdownIn 0.14s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dropdownIn: {
          '0%':   { opacity: '0', transform: 'translateY(-6px) scaleY(0.95)', transformOrigin: 'top' },
          '100%': { opacity: '1', transform: 'translateY(0) scaleY(1)',       transformOrigin: 'top' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
