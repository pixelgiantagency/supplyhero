import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        ScrollSmoother: 'readonly',
        SplitText: 'readonly',
        Observer: 'readonly',
        CustomEase: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: 'warn',
      'prefer-const': 'warn',
    },
  },
  eslintConfigPrettier,
];