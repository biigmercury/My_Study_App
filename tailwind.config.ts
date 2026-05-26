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
          // Core palette
          navy:  '#03045E',   // Deep Navy   — dark bg, primary dark text
          ocean: '#0077B6',   // Ocean Blue  — primary accent
          cyan:  '#00B4D8',   // Bright Cyan — secondary accent / hover
          ice:   '#90E0EF',   // Soft Ice Blue — dark mode text accent
          frost: '#CAF0F8',   // Light Frost — light mode background
          // Dark-mode card surface (slightly lighter than navy for depth)
          slate: '#0A1145',
          // Legacy aliases so all existing components keep working unchanged
          royal: '#0077B6',
          sky:   '#00B4D8',
          soft:  '#CAF0F8',
        },
      },
      backgroundImage: {
        // Ocean → Cyan: buttons, CTAs, progress bars, step circles
        'brand-gradient': 'linear-gradient(135deg, #0077B6, #00B4D8)',
        // Deep Navy → Ocean: hero banners, full-bleed sections
        'brand-gradient-deep': 'linear-gradient(135deg, #03045E, #0077B6)',
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [typography],
}

export default config
