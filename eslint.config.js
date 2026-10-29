import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'coverage/', 'dist/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
    },
  },
  {
    // Build script is a CLI tool, not the backend: console output is fine there.
    files: ['scripts/**/*.js'],
    rules: { 'no-console': 'off' },
  },
  {
    // Browser code served by Vercel (classic scripts, not ES modules).
    files: ['frontend/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser },
    },
  },
];
