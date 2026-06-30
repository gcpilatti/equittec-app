/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ECAD5D',
          light:   '#F5C98A',
          dark:    '#D4943A',
        },
      },
    },
  },
  plugins: [],
};
