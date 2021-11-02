module.exports = {
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif']
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      lg: '14px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px'
    },
    extend: {
      maxHeight: {
        '64': '16rem'
      },
      minWidth: {
        '40': '10rem',
        '56': '14rem'
      },
      maxWidth: {
        '32': '8rem',
        '56': '14rem'
      },
      spacing: {
        '7': '1.75rem',
        '14': '3.5rem',
        '18': '4.5rem',
        '28': '7rem',
        '72': '18rem',
        '80': '20rem'
      },
      boxShadow: {
        'outline-px': '0 0 0 1px rgba(66, 153, 225, 0.5)',
        DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        md: '0 0 2px 0 rgba(0, 0, 0, 0.10), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        button: '0 0.5px 0 0 rgba(0, 0, 0, 0.08)'
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.313rem', // 5px
        md: '0.375rem', // 6px
        lg: '0.5rem', // 8px
        xl: '0.75rem' // 12px
      },
      colors: {
        brand: '#2490EF',
        'brand-100': '#f4f9ff',
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
          '900': '#415668'
        },
        red: {
          100: '#fff5f5',
          200: '#fed7d7',
          300: '#feb2b2',
          400: '#fc8181',
          500: '#f56565',
          600: '#e53e3e',
          700: '#c53030',
          800: '#9b2c2c',
          900: '#742a2a'
        },
        orange: {
          100: '#fffaf0',
          200: '#feebc8',
          300: '#fbd38d',
          400: '#f6ad55',
          500: '#ed8936',
          600: '#dd6b20',
          700: '#c05621',
          800: '#9c4221',
          900: '#7b341e'
        },
        yellow: {
          100: '#fffff0',
          200: '#fefcbf',
          300: '#faf089',
          400: '#f6e05e',
          500: '#ecc94b',
          600: '#d69e2e',
          700: '#b7791f',
          800: '#975a16',
          900: '#744210'
        },
        green: {
          100: '#f0fff4',
          200: '#c6f6d5',
          300: '#9ae6b4',
          400: '#68d391',
          500: '#48bb78',
          600: '#38a169',
          700: '#2f855a',
          800: '#276749',
          900: '#22543d'
        },
        teal: {
          100: '#e6fffa',
          200: '#b2f5ea',
          300: '#81e6d9',
          400: '#4fd1c5',
          500: '#38b2ac',
          600: '#319795',
          700: '#2c7a7b',
          800: '#285e61',
          900: '#234e52'
        },
        blue: {
          100: '#ebf8ff',
          200: '#bee3f8',
          300: '#90cdf4',
          400: '#63b3ed',
          500: '#4299e1',
          600: '#3182ce',
          700: '#2b6cb0',
          800: '#2c5282',
          900: '#2a4365'
        },
        indigo: {
          100: '#ebf4ff',
          200: '#c3dafe',
          300: '#a3bffa',
          400: '#7f9cf5',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
          800: '#434190',
          900: '#3c366b'
        },
        purple: {
          100: '#faf5ff',
          200: '#e9d8fd',
          300: '#d6bcfa',
          400: '#b794f4',
          500: '#9f7aea',
          600: '#805ad5',
          700: '#6b46c1',
          800: '#553c9a',
          900: '#44337a'
        },
        pink: {
          100: '#fff5f7',
          200: '#fed7e2',
          300: '#fbb6ce',
          400: '#f687b3',
          500: '#ed64a6',
          600: '#d53f8c',
          700: '#b83280',
          800: '#97266d',
          900: '#702459'
        }
      }
    }
  },
  variants: {
    margin: ['responsive', 'first', 'last', 'hover', 'focus'],
    backgroundColor: ['responsive', 'first', 'hover', 'focus', 'focus-within'],
    display: ['group-hover']
  },
  plugins: []
};
