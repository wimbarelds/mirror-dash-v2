import type { OxfmtConfig } from 'vite-plus/fmt';

export default {
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'all',
  printWidth: 100,
  singleQuote: true,
  quoteProps: 'consistent',
  jsxSingleQuote: false,
  semi: true,
  arrowParens: 'always',
  ignorePatterns: ['node_modules', 'extension', 'dist', 'pnpm-lock.yaml'],
  sortImports: true,
  sortPackageJson: true,
  sortTailwindcss: {
    functions: ['clsx'],
    preserveWhitespace: true,
    stylesheet: './src/index.css',
  },
} satisfies OxfmtConfig;
