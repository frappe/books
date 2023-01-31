module.exports = {
  root: true,

  env: {
    node: true,
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
    'vue/no-mutating-props': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-useless-template-attributes': 'off',
  },

  parserOptions: {
    parser: '@typescript-eslint/parser',
  },

  extends: ['plugin:vue/vue3-essential', '@vue/typescript'],
};
