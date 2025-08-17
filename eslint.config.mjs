import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['**/*.{js,ts,vue,mjs,cjs}'], ignores: ['.nuxt/', 'node_modules/', '*.d.ts', 'coverage/', 'deployment/']
}, eslintPluginPrettierRecommended, {
  rules: {
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
    // Override recommended rules
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',

    // General code rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'comma-dangle': ['error', 'never'],

    // Additional Vue rules for TypeScript integration
    'vue/require-typed-ref': ['error'],
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/require-typed-object-prop': 'error',
    'vue/define-emits-declaration': ['error', 'type-based'],

    // Component structure and organization
    'vue/padding-line-between-blocks': ['error', 'always'],
    'vue/define-macros-order': ['error', {
      order: ['defineProps', 'defineEmits', 'defineModel', 'defineSlots', 'defineOptions']
    }],
    'vue/component-api-style': ['error', ['script-setup', 'composition']],
    'vue/block-order': ['error', {
      order: ['script', 'template', 'style']
    }],

    // Style and naming conventions
    'vue/html-closing-bracket-newline': ['error', {
      singleline: 'never', multiline: 'always'
    }],
    'vue/slot-name-casing': ['error', 'camelCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/custom-event-name-casing': ['error', 'camelCase'],
    'vue/v-on-event-hyphenation': ['error', 'never'],
    'vue/v-for-delimiter-style': ['error', 'in'],

    // Additional Vue quality rules
    'vue/no-ref-object-reactivity-loss': 'error',
    'vue/no-required-prop-with-default': 'error',
    'vue/no-unused-refs': 'error',
    'vue/prefer-separate-static-class': 'error',
    'vue/prefer-true-attribute-shorthand': 'error',
    'vue/valid-define-options': 'error'
  }
}, {
  rules: {
    quotes: ['error', 'single'], semi: ['error', 'never']
  }
}, {
  ignores: ['**/*.js', '**/*.cjs', '**/*.mjs'], rules: {
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true, allowTypedFunctionExpressions: true
    }],
    '@typescript-eslint/typedef': ['warn', {
      arrowParameter: false,
      memberVariableDeclaration: false,
      parameter: true,
      propertyDeclaration: false,
      variableDeclarationIgnoreFunction: true
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/ban-ts-comment': 'warn'
  }
}, {
  files: ['**/*.vue'], rules: {
    'vue/component-options-name-casing': ['error', 'PascalCase'],
    'vue/require-name-property': 'error',
    'vue/no-unused-properties': ['error', {
      groups: ['props', 'data', 'computed', 'methods', 'setup']
    }]
  }
})
