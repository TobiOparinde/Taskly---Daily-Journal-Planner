/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FFFFF8',
          100: '#FEFDF0',
          200: '#FDF8E1',
          300: '#FAF0C8',
          400: '#F5E6A3',
        },
      },
    },
  },
  plugins: [],
}
