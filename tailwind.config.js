/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2E7D32',
          orange: '#FF6B35',
          light: '#F7F7F7',
        },
      },
    },
  },
  plugins: [],
};
