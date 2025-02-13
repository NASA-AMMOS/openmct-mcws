const globals = require('globals');
const js = require('@eslint/js');
const vueParser = require('vue-eslint-parser');
const babelParser = require('@babel/eslint-parser');
// eslint-plugin-prettier/recommended must be last in configuration
// so that eslint-config-prettier has the opportunity to override other configs
const prettierRecommended = require('eslint-plugin-prettier/recommended');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  { files: ['**/*.{js,mjs,cjs,vue}'] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.jasmine,
        ...globals.amd,
        ...globals.node
      },
      parser: vueParser,
      parserOptions: {
        parser: babelParser,
        requireConfigFile: false,
        allowImportExportEverywhere: true,
        ecmaVersion: 'latest',
        ecmaFeatures: {
          impliedStrict: true
        },
        sourceType: 'module'
      }
    }
  },
  js.configs.recommended,
  prettierRecommended
];
