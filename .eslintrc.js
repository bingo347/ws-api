const path = require('path');

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: [
            path.resolve(__dirname, './tsconfig.base.json')
        ],
        tsconfigRootDir: __dirname
    },
    plugins: [
        '@typescript-eslint',
        'array-func',
        'fp',
        'immutable',
        'promise',
        'jest',
        'eslint-comments'
    ],
    env: {
        es6: true,
        browser: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:jest/recommended'
    ],
    overrides: [{
        files: ['*.test.ts'],
        env: {
            jest: true
        },
        rules: {
            'fp/no-nil': 0,
            '@typescript-eslint/no-empty-function': 0
        }
    }],
    rules: {
        'indent': [2, 4],
        'linebreak-style': 0,
        'quotes': [2, 'single'],
        'semi': [2, 'always'],
        'eqeqeq': 2,
        'no-cond-assign': 0,
        'no-console': 1,
        'no-constant-condition': 1,
        'no-debugger': 1,
        'no-empty': 1,
        'no-unsafe-negation': 1,
        'no-caller': 2,
        'no-alert': 1,
        'no-case-declarations': 0,
        'no-else-return': 2,
        'no-eval': 2,
        'no-extend-native': 1,
        'no-fallthrough': 0,
        'no-sparse-arrays': 0,
        'no-param-reassign': 2,
        'no-redeclare': 2,
        'no-self-compare': 1,
        'no-self-assign': 1,
        'no-with': 2,
        'array-bracket-spacing': [2, 'never'],
        'block-spacing': [2, 'always'],
        'brace-style': [2, '1tbs', {allowSingleLine: true}],
        'camelcase': 1,
        'comma-dangle': [2, 'never'],
        'comma-spacing': 1,
        'comma-style': 1,
        'computed-property-spacing': [2, 'never'],
        'func-style': [2, 'declaration', {allowArrowFunctions: true}],
        'keyword-spacing': [1, {overrides: {
            'for': {after: false},
            'while': {after: false},
            'if': {after: false},
            'switch': {after: false},
            'catch': {after: false}
        }}],
        'no-lonely-if': 2,
        'no-trailing-spaces': 1,
        'no-whitespace-before-property': 2,
        'operator-linebreak': [1, 'before'],
        'padded-blocks': [1, 'never'],
        'space-before-blocks': [1, 'always'],
        'space-before-function-paren': [1, 'never'],
        'space-in-parens': [1, 'never'],
        'space-infix-ops': [1, {int32Hint: true}],
        'space-unary-ops': [2, {words: true, nonwords: false}],
        'no-class-assign': 2,
        'no-import-assign': 2,
        'array-callback-return': 1,
        'curly': 2,
        'default-param-last': 2,
        'dot-location': [2, 'property'],
        'no-loop-func': 2,
        'no-return-await': 2,
        'radix': [2, 'as-needed'],
        'no-shadow': 1,
        'max-depth': [1, 5],
        'max-lines-per-function': [1, 20],
        'max-nested-callbacks': [1, 3],
        'one-var-declaration-per-line': 2,
        'arrow-spacing': 2,
        'no-confusing-arrow': 2,
        'no-var': 2,
        'object-shorthand': [2, 'always', {avoidExplicitReturnArrows: true}],
        'prefer-arrow-callback': [2, {allowNamedFunctions: true}],
        'prefer-const': 2,
        'prefer-destructuring': 2,
        'prefer-rest-params': 2,
        'prefer-spread': 2,
        'prefer-template': 2,
        'rest-spread-spacing': [2, 'never'],
        /* ------ PLUGINS ------- */
        // typescript
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-use-before-define': 0,
        '@typescript-eslint/ban-ts-ignore': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        // array-func
        'array-func/from-map': 2,
        'array-func/no-unnecessary-this-arg': 2,
        'array-func/prefer-array-from': 2,
        'array-func/avoid-reverse': 2,
        'array-func/prefer-flat-map': 1,
        'array-func/prefer-flat': 1,
        // fp
        'fp/no-arguments': 2,
        'fp/no-delete': 2,
        'fp/no-loops': 2,
        'fp/no-mutating-assign': 2,
        'fp/no-mutating-methods': 2,
        'fp/no-mutation': 2,
        'fp/no-nil': 2,
        'fp/no-this': 2,
        'fp/no-throw': 2,
        // immutable
        'immutable/no-mutation': 0,
        'immutable/no-let': 2,
        'immutable/no-this': 0,
        // promise
        'promise/catch-or-return': 2,
        'promise/param-names': 2,
        'promise/always-return': 2,
        'promise/no-new-statics': 2,
        'promise/valid-params': 2,
        // eslint-comments
        'eslint-comments/disable-enable-pair': 2,
        'eslint-comments/no-duplicate-disable': 2,
        'eslint-comments/no-unlimited-disable': 2,
        'eslint-comments/no-unused-disable': 2,
        'eslint-comments/no-unused-enable': 2,
    }
};
