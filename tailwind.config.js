/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#2EC4B6',
        accent: '#9B5DE5',
        background: '#FFF8F0',
        surface: '#FFFFFF',
        success: '#00B894',
        warning: '#FDCB6E',
        danger: '#E84393',
        text: {
          primary: '#2D3436',
          secondary: '#636E72',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
