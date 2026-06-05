export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50:'#f0f0ff',100:'#e0e0ff',200:'#c4c4ff',300:'#a0a0ff',400:'#7c7cff',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
        surface: { 900:'#0a0a0f',800:'#0f0f1a',700:'#141420',600:'#1a1a2e',500:'#1e1e3a',400:'#252545' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      animation: { 'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite', 'float':'float 6s ease-in-out infinite', 'glow':'glow 2s ease-in-out infinite', 'fade-in':'fadeIn 0.5s ease-out' },
      keyframes: {
        float: { '0%,100%':{ transform:'translateY(0px)' }, '50%':{ transform:'translateY(-10px)' } },
        glow: { '0%,100%':{ boxShadow:'0 0 20px rgba(99,102,241,0.3)' }, '50%':{ boxShadow:'0 0 40px rgba(99,102,241,0.6)' } },
        fadeIn: { from:{ opacity:0 }, to:{ opacity:1 } },
      },
    },
  },
  plugins: [],
};
