import { resolve } from 'node:path';
import process from 'process';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, UserConfig } from 'vite-plus';

import fmtCfg from './oxfmt.config';
import lintCfg from './oxlint.config';

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [...tailwindcss(), react()],
    staged: { '*': 'vp check --fix' },
    lint: lintCfg,
    fmt: fmtCfg,
    base: env.BASE_DIR || '/',
    build: {
      rollupOptions: {
        // The mock data page is separate, so the mirror never loads its data
        input: {
          main: resolve(process.cwd(), 'index.html'),
          mockdata: resolve(process.cwd(), 'mockdata.html'),
        },
      },
    },
    server: {
      proxy: {
        // Dev only: forwards OV requests when VITE_OV_API_URL is empty (the API sends no CORS headers)
        '/tpc': { target: 'http://v0.ovapi.nl', changeOrigin: true },
      },
    },
  };
});
