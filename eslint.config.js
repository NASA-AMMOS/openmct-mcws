import globals from 'globals';
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import babelParser from '@babel/eslint-parser';
// eslint-plugin-prettier/recommended must be last in configuration
// so that eslint-config-prettier has the opportunity to override other configs
import prettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
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
