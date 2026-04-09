import vue from '@vitejs/plugin-vue';
import builder from 'electron-builder';
import esbuild from 'esbuild';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { getMainProcessCommonConfig } from './helpers.mjs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import frappeBooksConfig from '../../electron-builder-config.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..', '..');
const buildDirPath = path.join(root, 'dist_electron', 'build');
const packageDirPath = path.join(root, 'dist_electron', 'bundled');
const mainFileName = 'main.js';
const commonConfig = getMainProcessCommonConfig(root);

const rawArgs = yargs(hideBin(process.argv))
  .option('nosign', {
    type: 'boolean',
    description: 'Run electron-builder without code signing',
  })
  .option('nopackage', {
    type: 'boolean',
    description: 'Only build the source files, electron-builder will not run',
  });

const argv = rawArgs.argv;
if (argv.nosign) {
  process.env['CSC_IDENTITY_AUTO_DISCOVERY'] = false;
}

updatePaths();
await buildMainProcessSource();
await buildRendererProcessSource();
copyPackageJson();

if (!argv.nopackage) {
  await packageApp();
}

function updatePaths() {
  fs.removeSync(buildDirPath);
  fs.ensureDirSync(buildDirPath);
  fs.removeSync(packageDirPath);
  fs.ensureDirSync(packageDirPath);
  fs.ensureDirSync(path.join(buildDirPath, 'node_modules'));
}

async function buildMainProcessSource() {
  const result = await esbuild.build({
    ...commonConfig,
    outdir: path.join(buildDirPath),
  });

  if (result.errors.length) {
    console.error('app build failed due to main process source build');
    result.errors.forEach((err) => console.error(err));
    process.exit(1);
  }
}

async function buildRendererProcessSource() {
  const base = 'app://';
  const outDir = path.join(buildDirPath, 'src');
  await vite.build({
    base: `/${base}`,
    root: path.join(root, 'src'),
    build: { outDir, sourcemap: true },
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
 * Copies the package.json file to the build folder with the
 * following changes:
 * - Irrelevant fields are removed.
 * - Non-external deps (those that are bundled) and devDeps are removed.
 * - Main file is updated to the bundled main process JS file.
 */
function copyPackageJson() {
  const packageJsonText = fs.readFileSync(path.join(root, 'package.json'), {
    encoding: 'utf-8',
  });

  const packageJson = JSON.parse(packageJsonText);
  const keys = [
    'name',
    'version',
    'description',
    'author',
    'homepage',
    'repository',
    'license',
  ];
  const modifiedPackageJson = {};
  for (const key of keys) {
    modifiedPackageJson[key] = packageJson[key];
  }

  modifiedPackageJson.main = mainFileName;
  modifiedPackageJson.dependencies = {};

  for (const dep of commonConfig.external) {
    modifiedPackageJson.dependencies[dep] = packageJson.dependencies[dep];
  }

  fs.writeFileSync(
    path.join(buildDirPath, 'package.json'),
    JSON.stringify(modifiedPackageJson, null, 2),
    {
      encoding: 'utf-8',
    }
  );
}

/**
 * On Linux, installs an rpmbuild compatibility wrapper into a temp directory
 * and prepends it to PATH before electron-builder runs.
 *
 * This fixes a breaking change in rpm 6.x (Fedora 44+) that is incompatible
 * with the bundled fpm 1.9.3:
 *   - rpm 6.x added a %mkbuilddir phase that wipes %{buildroot} before %install
 *   - fpm 1.9.3 stages files into BUILD/ and uses '%install # noop', expecting
 *     those files to already be present in the buildroot
 *   - The wrapper patches the generated spec's %install to restore the staged
 *     files after %mkbuilddir has created a fresh empty buildroot
 *
 * See: build/scripts/rpmbuild-compat.sh
 */
function setupRpmbuildWrapper() {
  const wrapperSrc = path.join(dirname, 'rpmbuild-compat.sh');
  const tempBinDir = path.join(os.tmpdir(), 'frappe-books-rpmbuild-compat');
  const wrapperDst = path.join(tempBinDir, 'rpmbuild');

  fs.ensureDirSync(tempBinDir);
  fs.copySync(wrapperSrc, wrapperDst);
  fs.chmodSync(wrapperDst, 0o755);

  process.env.PATH = `${tempBinDir}:${process.env.PATH}`;
  console.log(`rpmbuild-compat: wrapper installed at ${wrapperDst}`);
}

/**
 * Packages the app using electron builder.
 *
 * Note: this also handles signing and notarization if the
 * appropriate flags are set.
 *
 * Electron builder cli [commands](https://www.electron.build/cli)
 * are passed on as builderArgs.
 */
async function packageApp() {
  if (process.platform === 'linux') {
    setupRpmbuildWrapper();
  }

  const { configureBuildCommand } = await await import(
    'electron-builder/out/builder.js'
  );

  const builderArgs = rawArgs
    .command(['build', '*'], 'Build', configureBuildCommand)
    .parse();

  for (const opt of ['nosign', 'nopackage']) {
    delete builderArgs[opt];
  }

  let buildOptions = {
    config: frappeBooksConfig,
    ...builderArgs,
  };

  await builder.build(buildOptions);
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
  const TEXT_EXTENSIONS = new Set([
    '.js',
    '.mjs',
    '.cjs',
    '.css',
    '.html',
    '.svg',
    '.json',
    '.map',
    '.txt',
    '.ts',
  ]);

  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      removeBaseLeadingSlash(filePath, base);
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) {
      continue;
    }

    const contents = fs.readFileSync(filePath).toString('utf-8');
    fs.writeFileSync(filePath, contents.replaceAll('/' + base, base));
  }
}
