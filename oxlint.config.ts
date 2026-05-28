import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['oxc', 'typescript', 'react', 'unicorn'],
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
  },
  ignorePatterns: ['dist'],
  rules: {
    'typescript/no-floating-promises': 'off',
    'unicorn/no-new-array': 'off',
    'vite-plus/prefer-vite-plus-imports': 'error',
    'typescript/unbound-method': 'off',
    'eslint/no-unassigned-vars': 'off',
  },
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'warn',
    denyWarnings: true,
  },
  jsPlugins: [
    {
      name: 'vite-plus',
      specifier: 'vite-plus/oxlint-plugin',
    },
  ],
});
