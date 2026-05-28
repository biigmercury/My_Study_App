import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Accent / primary interactive colour — user selected #00B4D8
          royal:   '#00B4D8',  // accent: cyan — rings, progress bars, CTAs
          sky:     '#90E0EF',  // soft sky — dark-mode muted accents
          navy:    '#03045E',  // deep navy — text / brand
          slate:   '#0A0F45',  // dark nav/header bg
          surface: '#0F1656',  // dark elevated card surface
          soft:    '#F4FAFC',  // lightest bg — light-mode body
          bg:      '#01022E',  // dark-mode body bg
          cyan:    '#90E0EF',  // alias for sky
          mist:    '#CAF0F8',  // very light wash
          deep:    '#0077B6',  // deep blue — gradient start only
        },
      },
      backgroundImage: {
        // Gradient goes deep → accent (dark-to-cyan — looks great on buttons)
        'brand-gradient': 'linear-gradient(135deg, #0077B6, #00B4D8)',
      },
      fontFamily: {
        serif: ['"New York"', 'ui-serif', 'Georgia', 'serif'],
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [typography],
}

export default config
