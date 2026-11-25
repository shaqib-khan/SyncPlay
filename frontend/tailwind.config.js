/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F1014',
        'bg-secondary': '#16181F',
        'bg-card': '#1C2029',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8F98B2',
        'border-color': 'rgba(255, 255, 255, 0.08)',
        'accent-blue': '#0F53EC',
        'accent-purple': '#7B2CBF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0F53EC 0%, #7B2CBF 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #1A62FF 0%, #8C3CE5 100%)',
        'hero-gradient': 'linear-gradient(90deg, #0F1014 0%, rgba(15, 16, 20, 0.85) 45%, transparent 100%)',
        'hero-bottom-gradient': 'linear-gradient(180deg, transparent 0%, #0F1014 95%)',
        'card-gradient': 'linear-gradient(180deg, transparent 50%, rgba(15, 16, 20, 0.95) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
