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
    server: {
      proxy: {
        // Dev only: the OV API sends no CORS headers, so forward requests server-side instead.
        // Used when VITE_OV_API_URL is set to an empty string (same-origin `/tpc/...` requests).
        '/tpc': { target: 'http://v0.ovapi.nl', changeOrigin: true },
      },
    },
  };
});
