import chokidar from 'chokidar';
import esbuild from 'esbuild';
import { $ } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMainProcessCommonConfig } from './helpers.mjs';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
process.env['NODE_ENV'] = 'development';
process.env['VITE_HOST'] = '127.0.0.1';
process.env['VITE_PORT'] = 6969;

/**
 * This script does several things:
 * 1. Runs the vite server in dev mode `yarn vite` (unless --no-renderer is passed)
 * 2. Runs a file watcher for the main processes
 * 3. Builds the main process on file changes
 * 4. Runs electron which loads renderer using vite server url
 */

/**
 * @type {null | Function} global function used to stop dev
 */
const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..', '..');
const $$ = $({ stdio: 'inherit' });
let isReload = false;

/**
 * @type {null | import('execa').ExecaChildProcess<string>}
 */
let electronProcess = null;

console.log(`running Frappe Books in dev mode\nroot: ${root}`);
/**
 * @type {import('execa').ExecaChildProcess<string>}
 */
const viteProcess = $$`yarn vite`;
/**
 * Create esbuild context that is used
 * to [re]build the main process code
 */
const ctx = await esbuild.context({
  ...getMainProcessCommonConfig(root),
  outdir: path.join(root, 'dist_electron', 'dev'),
});

/**
 * Create a file watcher so that rebuild
 * can be triggered everytime a main process
 * file changes.
 */
const fswatcher = chokidar.watch([
  path.join(root, 'main.ts'),
  path.join(root, 'main'),
  path.join(root, 'backend'),
  path.join(root, 'schemas'),
]);

/**
 * Callback function to cleanly shut file watching
 * and rebuilding objects.
 *
 * Called on CTRL+C and kill
 */
const terminate = async () => {
  await fswatcher.close();
  await ctx.dispose();

  if (electronProcess) {
    electronProcess.kill();
  }

  if (viteProcess) {
    viteProcess.kill();
  }
  process.exit();
};
process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
if (viteProcess) {
  viteProcess.on('close', terminate);
}

/**
 * Build once and run electron before setting file watcher
 */
await handleResult(await ctx.rebuild());
electronProcess = runElectron();

/**
 * On main process source files change
 * - rebuild main process
 * - restart electron
 */
fswatcher.on('change', async (path) => {
  console.log(`change detected:\n\t${path}`);
  const result = await ctx.rebuild();
  await handleResult(result);
  console.log(`main process source rebuilt\nrestarting electron`);

  if (electronProcess) {
    isReload = true;
    electronProcess.kill();
    electronProcess = runElectron();
  }
});

/**
 * @param {esbuild.BuildResult} result
 */
async function handleResult(result) {
  if (!result.errors.length) {
    return;
  }

  console.log('error on build');
  for (const error of result.errors) {
    console.log(error);
  }

  await terminate();
}

function runElectron() {
  const electronProcess = $$`npx electron --inspect=5858 ${path.join(
    root,
    'dist_electron',
    'dev',
    'main.js'
  )}`;

  electronProcess.on('close', async () => {
    if (isReload) {
      return;
    }

    await terminate();
  });

  return electronProcess;
}
