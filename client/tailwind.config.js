/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde8ff',
          500: '#3b65f5',
          600: '#2f55e0',
          700: '#2444c7',
        }
      }
    },
  },
  plugins: [],
}
