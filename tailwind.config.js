/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink: '#0a0a0f',
        surface: '#12121a',
        card: '#1c1c28',
        border: '#2a2a3a',
        accent: '#6c63ff',
        'accent-hot': '#ff6584',
        'accent-cool': '#43e8d8',
        muted: '#6b6b80',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 30px rgba(108,99,255,0.35)',
        'glow-hot': '0 0 30px rgba(255,101,132,0.35)',
        'glow-cool': '0 0 30px rgba(67,232,216,0.35)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
