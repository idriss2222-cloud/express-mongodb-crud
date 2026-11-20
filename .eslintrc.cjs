module.exports = {
  env: {
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module"
  },
  rules: {
    "no-undef": "error",
    "no-unused-vars": "warn",
    "eqeqeq": "warn",
    "no-console": "off"
  }
};
