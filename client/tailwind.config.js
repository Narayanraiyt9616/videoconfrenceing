/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hub: {
          black: '#000000',
          dark: '#0d0d0d',
          surface: '#181818',
          card: '#222222',
          border: '#333333',
          orange: '#ffa31a',
          orangeHover: '#ff9000',
          gold: '#ffb338',
          text: '#ffffff',
          muted: '#9e9e9e',
          subtle: '#666666'
        },
        dark: {
          950: '#000000',
          900: '#0d0d0d',
          850: '#161616',
          800: '#202020',
          700: '#2c2c2c',
          600: '#3a3a3a'
        },
        kalesh: {
          orange: '#ffa31a',
          coral: '#ffb338',
          yellow: '#ffcc00',
          fire: '#ff9000',
          purple: '#ffa31a',
          pink: '#ff9000',
          neonCyan: '#ffa31a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
        display: ['Impact', 'Arial Black', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
