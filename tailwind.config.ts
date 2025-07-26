import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Sanctuary Colors
        sanctuary: {
          white: "#FFFFFF",
          lavender: "#E6E6FA",
          navy: "#1E3A8A",
          gray: "#F8FAFC",
          sage: "#9CA3AF",
        },
        // Glass Morphism Colors
        glass: {
          white: "rgba(255, 255, 255, 0.25)",
          dark: "rgba(0, 0, 0, 0.1)",
          border: "rgba(255, 255, 255, 0.3)",
          input: "rgba(255, 255, 255, 0.15)",
          'input-border': "rgba(255, 255, 255, 0.2)",
        },
      },
      fontFamily: {
        'sf-pro': ['"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        'sf-text': ['"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-large': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-medium': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-large': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-medium': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'micro': ['12px', { lineHeight: '1.3', fontWeight: '400' }],
      },
      spacing: {
        '4px': '4px',
        '8px': '8px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '48px': '48px',
        '64px': '64px',
        // Adding container spacing
        'sanctuary-xs': '16px',
        'sanctuary-sm': '24px',
        'sanctuary-md': '32px',
        'sanctuary-lg': '48px',
        'sanctuary-xl': '64px',
      },
      backdropBlur: {
        'glass': '20px',
      },
      borderRadius: {
        'glass': '16px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'breathing': 'breathe 4s ease-in-out infinite',
        'gentle-scale': 'gentle-scale 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'gentle-scale': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      zIndex: {
        'base': '0',
        'content': '1',
        'cards': '10',
        'navigation': '100',
        'overlay': '1000',
        'toast': '10000',
      },
    },
  },
  plugins: [
    // Adding custom glass utility classes as a plugin
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        '.glass-button': {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-out',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        '.glass-input': {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          transition: 'all 0.3s ease-out',
          '&:focus': {
            borderColor: '#E6E6FA',
            boxShadow: '0 0 0 2px rgba(230, 230, 250, 0.3)',
            outline: 'none',
          },
        },
        '.breathing': {
          animation: 'breathe 4s ease-in-out infinite',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};

export default config; 