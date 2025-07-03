import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/domains/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Extend Material-UI theme integration
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
          950: '#062e5f',
        },
        secondary: {
          50: '#fce4ec',
          100: '#f8bbd9',
          200: '#f48fb1',
          300: '#f06292',
          400: '#ec407a',
          500: '#e91e63',
          600: '#d81b60',
          700: '#c2185b',
          800: '#ad1457',
          900: '#880e4f',
          950: '#5c0a35',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#0f0f0f',
        },
        // Status colors for MES operations
        success: {
          50: '#f1f8e9',
          100: '#dcedc8',
          200: '#c5e1a5',
          300: '#aed581',
          400: '#9ccc65',
          500: '#8bc34a',
          600: '#7cb342',
          700: '#689f38',
          800: '#558b2f',
          900: '#33691e',
          950: '#1b5e20',
        },
        warning: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ffc107',
          600: '#ffb300',
          700: '#ffa000',
          800: '#ff8f00',
          900: '#ff6f00',
          950: '#e65100',
        },
        error: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336',
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
          950: '#7f0000',
        },
        info: {
          50: '#e1f5fe',
          100: '#b3e5fc',
          200: '#81d4fa',
          300: '#4fc3f7',
          400: '#29b6f6',
          500: '#03a9f4',
          600: '#039be5',
          700: '#0288d1',
          800: '#0277bd',
          900: '#01579b',
          950: '#002f4a',
        },
      },
      // Mobile-first design system
      spacing: {
        '18': '4.5rem',    // 72px
        '88': '22rem',     // 352px
        '112': '28rem',    // 448px
        '128': '32rem',    // 512px
      },
      // Touch-friendly sizing for industrial environment
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      // Industrial-grade shadows
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        // Custom shadows for MES components
        'card': '0 2px 8px 0 rgb(0 0 0 / 0.12)',
        'elevated': '0 4px 12px 0 rgb(0 0 0 / 0.15)',
        'floating': '0 8px 24px 0 rgb(0 0 0 / 0.18)',
      },
      // Animation for smooth interactions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-light': 'bounceLight 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      // Responsive breakpoints optimized for industrial tablets and phones
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for MES devices
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
      // Z-index scale for layering
      zIndex: {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        'sidebar': '1000',
        'modal': '2000',
        'popover': '3000',
        'tooltip': '4000',
        'toast': '5000',
      },
      // Border radius for consistent design
      borderRadius: {
        'none': '0px',
        'sm': '0.125rem',
        'default': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      // Grid system for layout
      gridTemplateColumns: {
        'sidebar': '250px 1fr',
        'sidebar-collapsed': '60px 1fr',
        'dashboard': 'repeat(auto-fit, minmax(300px, 1fr))',
        'cards': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
      // Backdrop blur for modern glassmorphism effects
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
    },
  },
  plugins: [
    // Custom utilities for MES-specific needs
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Touch-friendly interactive elements (44px minimum)
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        // High contrast for industrial environment
        '.high-contrast': {
          filter: 'contrast(1.2) brightness(1.1)',
        },
        // Glass effect for modern UI
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.2)',
        },
        // Status indicators
        '.status-online': {
          color: theme('colors.success.600'),
          backgroundColor: theme('colors.success.50'),
          borderColor: theme('colors.success.200'),
        },
        '.status-offline': {
          color: theme('colors.error.600'),
          backgroundColor: theme('colors.error.50'),
          borderColor: theme('colors.error.200'),
        },
        '.status-warning': {
          color: theme('colors.warning.600'),
          backgroundColor: theme('colors.warning.50'),
          borderColor: theme('colors.warning.200'),
        },
        // Sidebar utilities
        '.sidebar-width': {
          width: '250px',
        },
        '.sidebar-collapsed-width': {
          width: '60px',
        },
        // Print-friendly utilities
        '@media print': {
          '.print-hide': {
            display: 'none !important',
          },
          '.print-show': {
            display: 'block !important',
          },
        },
      }
      addUtilities(newUtilities)
    },
  ],
  // Dark mode configuration
  darkMode: 'class',
  // Safelist for dynamic classes used in MES components
  safelist: [
    'text-success-600',
    'text-warning-600',
    'text-error-600',
    'text-info-600',
    'bg-success-50',
    'bg-warning-50',
    'bg-error-50',
    'bg-info-50',
    'border-success-200',
    'border-warning-200',
    'border-error-200',
    'border-info-200',
    'touch-target',
    'high-contrast',
    'glass',
    'glass-dark',
    'status-online',
    'status-offline',
    'status-warning',
  ],
}

export default config