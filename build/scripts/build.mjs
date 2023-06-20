import vue from '@vitejs/plugin-vue';
import esbuild from 'esbuild';
import { $ } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { getMainProcessCommonConfig } from './helpers.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..', '..');

const $$ = $({ stdio: 'inherit' });
await $$`rm -rf ${path.join(root, 'dist_electron', 'build')}`;

await buildMainProcessSource();
await buildRendererProcessSource();

async function buildMainProcessSource() {
  const commonConfig = getMainProcessCommonConfig(root);
  const result = await esbuild.build({
    ...commonConfig,
    outfile: path.join(root, 'dist_electron', 'build', 'main.js'),
  });

  if (result.errors.length) {
    console.error('app build failed due to main process source build');
    result.errors.forEach((err) => console.error(err));
    process.exit(1);
  }
}

async function buildRendererProcessSource() {
  const base = 'app://';
  const outDir = path.join(root, 'dist_electron', 'build', 'src');
  await vite.build({
    base: `/${base}`,
    root: path.join(root, 'src'),
    build: { outDir },
    plugins: [vue()],
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
        fyo: path.join(root, 'fyo'),
        src: path.join(root, 'src'),
        schemas: path.join(root, 'schemas'),
        backend: path.join(root, 'backend'),
        models: path.join(root, 'models'),
        utils: path.join(root, 'utils'),
        regional: path.join(root, 'regional'),
        reports: path.join(root, 'reports'),
        dummy: path.join(root, 'dummy'),
        fixtures: path.join(root, 'fixtures'),
      },
    },
  });
  removeBaseLeadingSlash(outDir, base);
}

/**
 * Removes leading slash from all renderer files
 * electron uses a custom registered protocol to load the
 * files: "app://"
 *
 * @param {string} dir
 * @param {string} base
 */
function removeBaseLeadingSlash(dir, base) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      removeBaseLeadingSlash(filePath, base);
      continue;
    }

    const contents = fs.readFileSync(filePath).toString('utf-8');
    fs.writeFileSync(filePath, contents.replaceAll('/' + base, base));
  }
}
