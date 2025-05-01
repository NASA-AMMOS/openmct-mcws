const globals = require('globals');
const js = require('@eslint/js');
const vue = require('eslint-plugin-vue');
const vueParser = require('vue-eslint-parser');
const babelParser = require('@babel/eslint-parser');
// eslint-plugin-prettier/recommended must be last in configuration
// so that eslint-config-prettier has the opportunity to override other configs
const prettierRecommended = require('eslint-plugin-prettier/recommended');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['**/dist/*', '**/target/*']
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.jasmine,
        ...globals.amd,
        ...globals.node,
        __OMM_VERSION__: 'readonly',
        __OMM_BUILD_DATE__: 'readonly',
        __OMM_REVISION__: 'readonly',
        __OMM_BUILD_BRANCH__: 'readonly'
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
  ...vue.configs['flat/recommended'],
  prettierRecommended,
  {
    rules: {
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none'
        }
      ],
      'prettier/prettier': 'error'
    }
  }
];
