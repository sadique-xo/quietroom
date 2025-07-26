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
        // Professional Color Palette
        primary: {
          DEFAULT: "#131313",
          light: "#1a1a1a",
          dark: "#0a0a0a",
        },
        secondary: {
          DEFAULT: "#414141",
          light: "#525252",
          dark: "#303030",
        },
        accent: {
          DEFAULT: "#E6E6FA",
          light: "#F0F0FF",
          dark: "#D8D8F0",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // Glass Morphism Colors
        glass: {
          white: "rgba(255, 255, 255, 0.7)",
          light: "rgba(255, 255, 255, 0.85)",
          medium: "rgba(255, 255, 255, 0.6)",
          dark: "rgba(19, 19, 19, 0.05)",
          border: "rgba(255, 255, 255, 0.2)",
        },
      },
      fontFamily: {
        'urbanist': ['var(--font-urbanist)', 'system-ui', 'sans-serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Enhanced 6-level typography scale
        'display-large': ['3.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-medium': ['2.5rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        'display-small': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'headline-large': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-medium': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
        'headline-small': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'title-large': ['1.125rem', { lineHeight: '1.45', fontWeight: '500' }],
        'title-medium': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'title-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        'body-large': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-medium': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-small': ['0.875rem', { lineHeight: '1.55', fontWeight: '400' }],
        'label-large': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label-medium': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label-small': ['0.6875rem', { lineHeight: '1.35', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'micro': ['0.6875rem', { lineHeight: '1.3', fontWeight: '400' }],
      },
      spacing: {
        '4px': '4px',
        '8px': '8px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '48px': '48px',
        '64px': '64px',
        // Enhanced container spacing
        'sanctuary-xs': '16px',
        'sanctuary-sm': '24px',
        'sanctuary-md': '32px',
        'sanctuary-lg': '48px',
        'sanctuary-xl': '64px',
        // Safe area spacing
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      borderRadius: {
        'glass': '16px',
        'modern': '20px',
        'island': '28px',
      },
      backdropBlur: {
        'glass': '20px',
        'nav': '24px',
        'strong': '32px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.15)',
        'nav': '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
        'card': '0 16px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 24px 60px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'breathing': 'breathe 4s ease-in-out infinite',
        'gentle-scale': 'gentle-scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
        'gentle-fade': 'gentle-fade 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'gentle-scale': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.8' },
        },
        'gentle-fade': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      zIndex: {
        'base': '0',
        'content': '1',
        'cards': '10',
        'navigation': '100',
        'overlay': '1000',
        'toast': '10000',
      },
      // Enhanced breakpoints for better responsive design
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    // Professional glass utility classes
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(19, 19, 19, 0.06), 0 1px 2px rgba(19, 19, 19, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        },
        '.nav-glass': {
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 32px rgba(19, 19, 19, 0.08), 0 2px 8px rgba(19, 19, 19, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        },
        '.card-modern': {
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(19, 19, 19, 0.06), 0 1px 2px rgba(19, 19, 19, 0.04)',
          transition: 'all 0.2s ease',
        },
        '.glass-button': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(19, 19, 19, 0.06), 0 1px 2px rgba(19, 19, 19, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          transition: 'all 0.2s ease',
          color: '#131313',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px rgba(19, 19, 19, 0.08), 0 2px 4px rgba(19, 19, 19, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            background: 'rgba(255, 255, 255, 0.8)',
          },
          '&:active': {
            transform: 'translateY(0)',
            transition: 'all 0.1s ease',
          },
        },
        '.glass-input': {
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
          color: '#131313',
          '&:focus': {
            borderColor: 'rgba(230, 230, 250, 0.5)',
            boxShadow: '0 0 0 3px rgba(230, 230, 250, 0.15), 0 4px 16px rgba(19, 19, 19, 0.06)',
            outline: 'none',
            background: 'rgba(255, 255, 255, 0.75)',
          },
        },
        // Safe area utilities
        '.pt-safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.pb-safe-bottom': {
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        },
        '.pl-safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.pr-safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        // Enhanced container system
        '.mobile-container': {
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
          width: '100%',
          maxWidth: '100vw',
        },
        // Animation utilities
        '.ease-spring': {
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        '.will-change-transform': {
          willChange: 'transform',
        },
        '.will-change-opacity': {
          willChange: 'opacity',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};

export default config; 