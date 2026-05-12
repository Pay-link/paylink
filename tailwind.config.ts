import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        g1: '#1E6B32',
        g2: '#155226',
        g3: '#8DC63F',
        g4: '#A8D94F',
        'g-soft': '#EBF5EC',
        'g-mid': '#C8E6CA',
        'g-lime': '#F2FAE8',
        ink: '#0D1410',
        ink2: '#2D3D30',
        ink3: '#5C6E5E',
        ink4: '#8A9B8C',
        page: '#FAFBFA',
      },
      fontFamily: {
        sans: ['Google Sans', 'sans-serif'],
        display: ['Google Sans Flex', 'Google Sans Display', 'Google Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
        lg: '20px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 4px rgba(0,0,0,0.05)',
        DEFAULT: '0 2px 12px rgba(0,0,0,0.06)',
        md: '0 4px 24px rgba(0,0,0,0.08)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
export default config
