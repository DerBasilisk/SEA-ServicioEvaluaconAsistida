/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sea: {
          bg: '#FCFDF2',
          card: '#FFFFFF',
          edge: '#8CCED3',
          action: '#1A7F84',
          text: '#146B70',
          tbody: '#1A7F84',
          night: {
            bg: '#082F32',
            card: '#0D4145',
            edge: '#146B70',
            action: '#5AB9C1',
            text: '#E2F8F9',
            tbody: '#8CCED3',
          }
        }
      }
    }
  },
  plugins: [],
}