module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:vue/essential"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-useless-template-attributes": "off",
  },
  parserOptions: {
    parser: "@babel/eslint-parser"
  }
};
