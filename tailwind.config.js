/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        thai: {
          gold: '#FFD700',
          darkgold: '#B8860B',
          night: '#0B1021',
          river: '#081726',
          lotus: '#FF69B4',
          accent: '#FFA500'
        }
      },
      fontFamily: {
        thai: ['Prompt', 'Sarabun', 'sans-serif']
      }
    },
  },
  plugins: [],
}
