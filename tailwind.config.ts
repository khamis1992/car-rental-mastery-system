
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  future: {
    hoverOnlyWhenSupported: true,
  },
  safelist: [
    'rtl-flex',
    'rtl-title', 
    'rtl-label',
    'flex-row-reverse'
  ]
} satisfies Config

// Add RTL utility classes
const plugin = require('tailwindcss/plugin')

config.plugins?.push(
  plugin(function({ addUtilities }: { addUtilities: any }) {
    const rtlUtilities = {
      '.rtl-flex': {
        'display': 'flex',
        'align-items': 'center',
        'gap': '0.5rem',
        'flex-direction': 'row-reverse',
      },
      '.rtl-title': {
        'text-align': 'right',
        'direction': 'rtl',
      },
      '.rtl-label': {
        'text-align': 'right',
        'direction': 'rtl',
      },
    }
    addUtilities(rtlUtilities)
  })
)

export default config
