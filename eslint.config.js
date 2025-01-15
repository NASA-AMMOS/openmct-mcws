const globals = require("globals");
const js = require("@eslint/js");
const eslintPluginVue = require("eslint-plugin-vue");
const prettier = require("eslint-plugin-prettier");
const unicorn = require("eslint-plugin-unicorn");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const compat = require("eslint-plugin-compat");
const noUnsanitized = require("eslint-plugin-no-unsanitized");
const lodashUnderscore = require("eslint-plugin-you-dont-need-lodash-underscore");

module.exports = [
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx,vue}"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module",
            parser: require("vue-eslint-parser"),
            parserOptions: {
                parser: require("@babel/eslint-parser"),
                requireConfigFile: false,
                allowImportExportEverywhere: true,
                ecmaFeatures: {
                    impliedStrict: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.es2024,
                ...globals.jasmine,
                ...globals.amd,
                ...globals.node,
                _: 'readonly',
                __webpack_public_path__: 'writeable',
                __OPENMCT_VERSION__: 'readonly',
                __OPENMCT_BUILD_DATE__: 'readonly',
                __OPENMCT_REVISION__: 'readonly',
                __OPENMCT_BUILD_BRANCH__: 'readonly'
            }
        },
        plugins: {
            vue: eslintPluginVue,
            prettier,
            unicorn,
            'simple-import-sort': simpleImportSort,
            compat,
            'no-unsanitized': noUnsanitized,
            'you-dont-need-lodash-underscore': lodashUnderscore
        },
        rules: {
            'simple-import-sort/imports': 'warn',
            'simple-import-sort/exports': 'warn',
            'vue/no-deprecated-dollar-listeners-api': 'warn',
            'vue/no-deprecated-events-api': 'warn',
            'vue/no-v-for-template-key': 'off',
            'vue/no-v-for-template-key-on-child': 'error',
            'vue/component-name-in-template-casing': ['error', 'PascalCase'],
            'prettier/prettier': 'error',
            'you-dont-need-lodash-underscore/omit': 'off',
            'you-dont-need-lodash-underscore/throttle': 'off',
            'you-dont-need-lodash-underscore/flatten': 'off',
            'you-dont-need-lodash-underscore/get': 'off',
            'no-bitwise': 'error',
            'curly': 'error',
            'eqeqeq': 'error',
            'guard-for-in': 'error',
            'no-extend-native': 'error',
            'no-inner-declarations': 'off',
            'no-use-before-define': ['error', 'nofunc'],
            'no-caller': 'error',
            'no-irregular-whitespace': 'error',
            'no-new': 'error',
            'no-shadow': 'error',
            'no-undef': 'error',
            'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
            'no-console': 'off',
            'new-cap': ['error', { capIsNew: false, properties: false }],
            'dot-notation': 'error',
            'no-case-declarations': 'error',
            'max-classes-per-file': ['error', 1],
            'no-eq-null': 'error',
            'no-eval': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            'no-lone-blocks': 'error',
            'no-loop-func': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-octal-escape': 'error',
            'no-proto': 'error',
            'no-return-await': 'error',
            'no-script-url': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-useless-call': 'error',
            'no-nested-ternary': 'error',
            'no-useless-computed-key': 'error',
            'no-var': 'error',
            'one-var': ['error', 'never'],
            'default-case-last': 'error',
            'default-param-last': 'error',
            'grouped-accessor-pairs': 'error',
            'no-constructor-return': 'error',
            'array-callback-return': 'error',
            'no-invalid-this': 'error',
            'func-style': ['error', 'declaration'],
            'no-unused-expressions': 'error',
            'no-useless-concat': 'error',
            'radix': 'error',
            'require-await': 'error',
            'no-alert': 'error',
            'no-useless-constructor': 'error',
            'no-duplicate-imports': 'error',
            'no-implicit-coercion': 'error',
            'no-unneeded-ternary': 'error',
            'unicorn/filename-case': ['error', {
                cases: { pascalCase: true },
                ignore: ['^.*\\.(js|cjs|mjs)$']
            }],
            'vue/first-attribute-linebreak': 'error',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/no-mutating-props': 'off'
        }
    }
];
