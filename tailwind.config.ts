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
          // Primary palette — updated to new design system
          royal:  '#0077B6', // primary action / CTAs (was #1d4ed8)
          sky:    '#00B4D8', // accent / dark-mode highlights (was #38bdf8)
          navy:   '#03045E', // deep navy text + brand (was #0f172a)
          slate:  '#0A0F45', // dark card / surface bg (was #1e293b)
          soft:   '#F4FAFC', // lightest bg — light mode body (was #f0f4ff)
          bg:     '#01022E', // dark mode body bg
          cyan:   '#90E0EF', // soft sky / muted highlights
          mist:   '#CAF0F8', // very light wash
        },
      },
      backgroundImage: {
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
