const resolveConfig = require('tailwindcss/resolveConfig');
const tailwindConfig = require('../tailwind.config');

module.exports = resolveConfig(tailwindConfig).theme;
