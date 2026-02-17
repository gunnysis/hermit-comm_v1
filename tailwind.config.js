/** @type {import('tailwindcss').Config} */
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
        // 행복한 메인 색상
        happy: {
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE799',
          300: '#FFDB66',
          400: '#FFCF33',
          500: '#FFC300', // 메인 옐로우
          600: '#CC9C00',
          700: '#997500',
          800: '#664E00',
          900: '#332700',
        },
        // 코랄/핑크
        coral: {
          50: '#FFF1F0',
          100: '#FFE3E0',
          200: '#FFC7C2',
          300: '#FFABA3',
          400: '#FF8F85',
          500: '#FF7366', // 메인 코랄
          600: '#E65C52',
          700: '#CC453E',
          800: '#B32E29',
          900: '#991715',
        },
        // 민트
        mint: {
          50: '#F0FFF9',
          100: '#D1FFF0',
          200: '#A3FFE0',
          300: '#75FFD1',
          400: '#47FFC1',
          500: '#19FFB2', // 메인 민트
          600: '#00E699',
          700: '#00CC80',
          800: '#00B366',
          900: '#00994D',
        },
        // 라벤더
        lavender: {
          50: '#F9F5FF',
          100: '#F3EBFF',
          200: '#E7D7FF',
          300: '#DBC3FF',
          400: '#CFAFFF',
          500: '#C39BFF', // 메인 라벤더
          600: '#A77CE6',
          700: '#8B5DCC',
          800: '#6F3EB3',
          900: '#531F99',
        },
        // 피치
        peach: {
          50: '#FFF7F0',
          100: '#FFEFE0',
          200: '#FFDFC2',
          300: '#FFCFA3',
          400: '#FFBF85',
          500: '#FFAF66', // 메인 피치
          600: '#E69952',
          700: '#CC833E',
          800: '#B36D29',
          900: '#995715',
        },
        // 배경용 크림
        cream: {
          50: '#FFFEF5',
          100: '#FFFCEB',
          200: '#FFF9D6',
          300: '#FFF5C2',
          400: '#FFF2AD',
          500: '#FFEF99',
        },
      },
    },
  },
  plugins: [],
};
