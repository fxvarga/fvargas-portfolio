/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          light: '#2A2A2A',
          lighter: '#3A3A3A',
        },
        light: {
          DEFAULT: '#F9F5F0',
          warm: '#FDF8F3',
          cool: '#F5F5F5',
        },
      },
      fontFamily: {
        heading: ['Jost', 'sans-serif'],
        body: ['Urbanist', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
