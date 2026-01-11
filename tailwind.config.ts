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
        crystal: {
          bg: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(255, 255, 255, 0.3)',
        },
        accent: {
          DEFAULT: '#007AFF',
          hover: '#0056CC',
          light: 'rgba(0, 122, 255, 0.1)',
        },
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-crystal": "linear-gradient(135deg, #E8E1F5 0%, #E1EFF7 50%, #F5E1EA 100%)",
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        crystal: '0 8px 32px rgba(0, 0, 0, 0.1)',
        'crystal-lg': '0 16px 48px rgba(0, 0, 0, 0.15)',
        'crystal-xl': '0 24px 64px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
