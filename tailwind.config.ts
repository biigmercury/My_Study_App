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
          royal: '#1d4ed8',
          sky: '#38bdf8',
          navy: '#0f172a',
          slate: '#1e293b',
          soft: '#f0f4ff',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1d4ed8, #38bdf8)',
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [typography],
}

export default config
