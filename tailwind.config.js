/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideDown: {
          from: { height: 0, opacity: 0 },
          to: { height: 'var(--radix-collapsible-content-height)', opacity: 1 },
        },
        slideUp: {
          from: { height: 'var(--radix-collapsible-content-height)', opacity: 1 },
          to: { height: 0, opacity: 0 },
        },
      },
      animation: {
        slideDown: 'slideDown 300ms ease-out',
        slideUp: 'slideUp 300ms ease-out',
      },
    },
  },
  plugins: [],
}