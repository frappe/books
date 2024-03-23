const fs = require('fs');
const colors = JSON.parse(
  fs.readFileSync('colors.json', { encoding: 'utf-8' })
);

module.exports = {
  darkMode: 'class',
  purge: false,
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      lg: '14px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px',
    },
    extend: {
      maxHeight: {
        64: '16rem',
      },
      minWidth: {
        40: '10rem',
        56: '14rem',
      },
      maxWidth: {
        32: '8rem',
        56: '14rem',
      },
      spacing: {
        7: '1.75rem',
        14: '3.5rem',
        18: '4.5rem',
        28: '7rem',
        72: '18rem',
        80: '20rem',
      },
      boxShadow: {
        'outline-px': '0 0 0 1px rgba(66, 153, 225, 0.5)',
        DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        md: '0 0 2px 0 rgba(0, 0, 0, 0.10), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        button: '0 0.5px 0 0 rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.313rem', // 5px
        md: '0.375rem', // 6px
        lg: '0.5rem', // 8px
        xl: '0.75rem', // 12px
      },
      gridColumn: {
        'span-full': '1 / -1',
      },
      colors,
    },
  },
  variants: {
    margin: ['responsive', 'first', 'last', 'hover', 'focus'],
    backgroundColor: [
      'responsive',
      'first',
      'hover',
      'focus',
      'focus-within',
      'dark',
    ],
    display: ['group-hover'],
    fontWeight: ['dark'],
  },
  plugins: [require('tailwindcss-rtl')],
};

/*
 * 208, 100, 50
 * 209,  62, 50
 */
