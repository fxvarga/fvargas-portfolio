/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#FF2D8A',
        'neon-magenta': '#FF1493',
        'neon-cyan': '#00FFFF',
        'neon-green': '#39FF14',
        'dark-bg': '#0D0D0D',
        'dark-card': '#1A1A1A',
        'dark-surface': '#222222',
      },
      fontFamily: {
        'script': ['Neonderthaw', 'cursive'],
        'display': ['Bebas Neue', 'sans-serif'],
        'condensed': ['Oswald', 'Arial Narrow', 'sans-serif'],
        'body': ['Poppins', 'sans-serif'],
        'ui': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 7px #FF2D8A, 0 0 10px #FF2D8A, 0 0 21px #FF2D8A',
        'neon-strong': '0 0 7px #FF2D8A, 0 0 10px #FF2D8A, 0 0 21px #FF2D8A, 0 0 42px #FF1493',
      },
    },
  },
  plugins: [],
};
