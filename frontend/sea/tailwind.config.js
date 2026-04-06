/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // TUS COLORES ORIGINALES DEL SEA
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
      },
      // --- AQUÍ PEGAMOS LA MAGIA NUEVA ---
      animation: {
        'float-slow': 'floating 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
      // ----------------------------------
    }
  },
  plugins: [],
}