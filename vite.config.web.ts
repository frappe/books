import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * Vite config for the Web target (rendererWeb.ts / index.html), kept
 * separate from vite.config.ts — that one's `root` is `src/` and serves
 * renderer.ts for Electron's dev server; this one's `root` is the repo
 * root, since rendererWeb.ts and index.html live there per
 * context/architecture.md's target layout.
 *
 * Dev: `vite --config vite.config.web.ts`
 * Build: `vite build --config vite.config.web.ts` (outputs to dist_web/)
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
export default defineConfig({
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, './dist_web'),
    rollupOptions: {
      input: path.resolve(__dirname, './index.html'),
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      fyo: path.resolve(__dirname, './fyo'),
      src: path.resolve(__dirname, './src'),
      schemas: path.resolve(__dirname, './schemas'),
      backend: path.resolve(__dirname, './backend'),
      models: path.resolve(__dirname, './models'),
      utils: path.resolve(__dirname, './utils'),
      regional: path.resolve(__dirname, './regional'),
      reports: path.resolve(__dirname, './reports'),
      custom: path.resolve(__dirname, './custom'),
    },
  },
});
