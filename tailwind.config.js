module.exports = {
  theme: {
    fontFamily: {
      sans: ['Inter var experimental', 'sans-serif'],
    },
    extend: {
      maxHeight: {
        '64': '16rem'
      },
      minWidth: {
        '56': '14rem'
      },
      maxWidth: {
        '56': '14rem'
      },
      spacing: {
        '14': '3.5rem',
        '72': '18rem',
        '80': '20rem'
      },
      boxShadow: {
        'outline-px': '0 0 0 1px rgba(66,153,225,0.5)'
      },
      borderRadius: {
        '5px': '5px',
        '6px': '6px',
        '12px': '12px'
      },
      colors: {
        black: '#112B42',
        gray: {
          '100': '#f4f4f6',
          '200': '#e9ebed',
          '300': '#dfe1e2',
          '400': '#cccfd1',
          '500': '#b7bfc6',
          '600': '#a1abb4',
          '700': '#9fa5a8',
          '800': '#7f878a',
          '900': '#415668',
        }
      }
    }
  },
  variants: {
    margin: ['responsive', 'first', 'hover', 'focus'],
    backgroundColor: ['responsive', 'first', 'hover', 'focus', 'focus-within'],
  },
  plugins: []
};
