/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern gaming color palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          neon: '#00ff9d',
          cyber: '#7209b7',
          electric: '#3a86ff',
          plasma: '#ff006e',
          quantum: '#8338ec',
          matrix: '#06d6a0',
        },
        background: {
          dark: '#0a0a0f',
          darker: '#05050a',
          card: 'rgba(26, 26, 34, 0.7)',
          'card-hover': 'rgba(26, 26, 34, 0.9)',
          overlay: 'rgba(15, 15, 25, 0.85)',
        },
        text: {
          primary: '#f0f0f0',
          secondary: '#ccc',
          tertiary: '#aaa',
          muted: '#888',
        },
        border: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          dark: '#333',
        }
      },
      fontFamily: {
        sans: ['lato', 'sans-serif'],
        display: ['lato', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        thin: '900',
        extralight: '900',
        light: '900',
        normal: '900',
        medium: '900',
        semibold: '900',
        bold: '900',
        extrabold: '900',
        black: '900',
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glitch': 'glitch 0.3s linear infinite',
        'scanline': 'scanline 10s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'neon-flicker': 'neon-flicker 1.5s infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 157, 0.5)',
        'glow-lg': '0 0 40px rgba(0, 255, 157, 0.7)',
        'glow-xl': '0 0 60px rgba(0, 255, 157, 0.9)',
        'inner-glow': 'inset 0 0 20px rgba(0, 255, 157, 0.3)',
        'cyber': '0 0 30px rgba(114, 9, 183, 0.5)',
        'plasma': '0 0 30px rgba(255, 0, 110, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-grid': 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        'gradient-diagonal': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(90deg, #00ff9d, #3a86ff, #8338ec)',
        'gradient-cyber': 'linear-gradient(90deg, #7209b7, #3a86ff, #00ff9d)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}