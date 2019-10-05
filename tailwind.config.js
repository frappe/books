module.exports = {
  theme: {
    fontFamily: {
      sans: ['Inter var experimental', 'sans-serif']
    },
    extend: {
      spacing: {
        '72': '18rem',
        '80': '20rem'
      },
      boxShadow: {
        'outline-px': '0 0 0 1px rgba(66,153,225,0.5)'
      }
    }
  },
  variants: {
    margin: ['responsive', 'first', 'hover', 'focus']
  },
  plugins: []
};
