/** @type {import('tailwindcss').Config} */

// 색상 값은 SHARED_PALETTE (constants.generated.ts)와 동일하게 유지할 것
// 변경 시: supabase-hermit → sync-to-projects.sh → 이 파일에도 반영
const { SHARED_PALETTE } = require('./shared-palette');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.tsx",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['System', 'sans-serif'],
        mono: ['System', 'monospace'],
      },
      colors: {
        ...SHARED_PALETTE,
      },
    },
  },
  plugins: [],
};
