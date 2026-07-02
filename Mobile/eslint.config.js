const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  ...expoConfig,
  prettierRecommended,
  {
    ignores: ['dist/*', 'coverage/*'],
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];
