/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#140d0b',
        'brand-cream': '#fefae0',
        'brand-gold': '#bf953f',
        'brand-gold-light': '#fcf6ba',
      },
      fontFamily: {
        'tajawal': ['Tajawal', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 50%, #b38728 100%)',
      }
    },
  },
  plugins: [],
}
