/** @type {import('tailwindcss').Config} */
export default {
  // 核心：开启基于 class 的黑暗模式支持
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'card': 'var(--radius-card)',
        'inner': 'var(--radius-inner)',
        'btn': 'var(--radius-button)',
      },
      boxShadow: {
        'premium': 'var(--shadow-premium)',
        'premium-hover': 'var(--shadow-hover)',
      },
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      }
    },
  },
  plugins: [],
}
