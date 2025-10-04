/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sv-red': {
          50: '#fff0f0',
          100: '#ffd6d6',
          200: '#ffacac',
          300: '#ff8080',
          400: '#ff4d4d',
          500: '#ff2d2d',
          600: '#e22424',
          700: '#b51a1a',
          800: '#891010',
          900: '#5e0808',
        },
        'sv-blue': {
          50: '#e8faff',
          100: '#c8f4ff',
          200: '#95eaff',
          300: '#60dbff',
          400: '#2ccaff',
          500: '#00b7ff',
          600: '#0091cc',
          700: '#006b99',
          800: '#004866',
          900: '#002733',
        },
        'sv-magenta': {
          50: '#fff0fb',
          100: '#ffd9f2',
          200: '#ffb3e6',
          300: '#ff82d2',
          400: '#ff57c4',
          500: '#ff2dd6',
          600: '#e31ac8',
          700: '#b313a0',
          800: '#860a78',
          900: '#5a034f',
        },
        'sv-orange': {
          50: '#fff5ec',
          100: '#ffead0',
          200: '#ffd1a3',
          300: '#ffb36a',
          400: '#ff9540',
          500: '#ff7420',
          600: '#e65f18',
          700: '#b34712',
          800: '#7f2f0b',
          900: '#501806',
        },
      },
      boxShadow: {
        'sv-red-glow': '0 10px 40px rgba(255,45,45,0.32), 0 2px 8px rgba(255,45,45,0.12)',
        'sv-blue-glow': '0 10px 40px rgba(0,183,255,0.32), 0 2px 8px rgba(0,183,255,0.12)',
        'sv-magenta-glow': '0 10px 40px rgba(255,45,214,0.28), 0 2px 8px rgba(255,45,214,0.1)'
      },
      backgroundImage: {
        'sv-hero': "radial-gradient(circle at 15% 25%, rgba(0,183,255,0.10), transparent 12%), radial-gradient(circle at 85% 75%, rgba(255,45,45,0.12), transparent 18%), radial-gradient(circle at 50% 40%, rgba(255,45,214,0.06), transparent 25%), linear-gradient(180deg, #030612 0%, #0b0204 100%)",
      },
    },
  },
  plugins: [],
};
