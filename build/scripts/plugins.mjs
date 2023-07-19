import yargs from 'yargs';
import esbuild from 'esbuild';
import { hideBin } from 'yargs/helpers';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { constants } from 'fs';
import { excludeVendorFromSourceMap } from './helpers.mjs';
import AdmZip from 'adm-zip';

const argv = yargs(hideBin(process.argv))
  .option('list', {
    describe: 'list plugins under development',
    type: 'boolean',
  })
  .option('init', {
    describe: 'initialize a new plugin in the plugin folder',
    type: 'string',
  })
  .option('build', {
    describe: 'build a plugin from the plugins folder',
    type: 'string',
  })
  .help().argv;

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..', '..', 'plugins');
const buildDirPath = path.join(root, '..', 'dist_electron', 'plugins');

if (argv.list) {
  listPlugins();
} else if (typeof argv.init === 'string') {
  console.log('to be added');
} else if (typeof argv.build === 'string') {
  await buildPlugin(argv.build);
}

async function buildPlugin(pluginName) {
  if (pluginName === '') {
    pluginName = fs.readdirSync(root)[0];
  }

  if (!pluginName) {
    console.log('no plugins found');
    return;
  }

  const pluginPath = path.join(root, pluginName);
  const infoFile = fs.readFileSync(path.join(pluginPath, 'info.json'), 'utf-8');
  const info = JSON.parse(infoFile);

  /**
   * Update info
   */
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, '..', 'package.json'))
  );
  info.date = new Date().toISOString();
  info.books_version = packageJson.version;

  console.log(`building: ${info.name}`);

  /**
   * Create folder for plugin build.
   * Plugin package will be stored in `pluginBuildPath/..`
   */
  const pluginBuildPath = path.join(buildDirPath, pluginName, 'build');
  fs.ensureDirSync(pluginBuildPath);

  /**
   * Write info file into the pluginBuildPath
   */
  fs.writeFileSync(
    path.join(pluginBuildPath, 'info.json'),
    JSON.stringify(info)
  );

  /**
   * Get entry points for esbuild to build from
   */
  const entryPoints = getEntryPoints(pluginPath);

  /**
   * Build files from entry points.
   */
  for (const key in entryPoints) {
    const entryPath = entryPoints[key];
    const result = await esbuild.build({
      entryPoints: [entryPath],
      sourcemap: 'inline',
      sourcesContent: false,
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: path.join(pluginBuildPath, `${key}.js`),
      external: ['knex', 'electron', 'better-sqlite3', 'electron-store'],
      plugins: [excludeVendorFromSourceMap],
      write: true,
    });

    if (result.errors.length) {
      console.error('app build failed due to main process source build');
      result.errors.forEach((err) => console.error(err));
      process.exit(1);
    }
  }

  await createPluginPackage(pluginName, pluginBuildPath);
}

async function createPluginPackage(pluginName, pluginBuildPath) {
  const zip = new AdmZip();
  for (const file of fs.readdirSync(pluginBuildPath)) {
    const filePath = path.join(pluginBuildPath, file);
    zip.addLocalFile(filePath);
  }

  const packagePath = path.join(
    pluginBuildPath,
    '..',
    `${pluginName}.books_plugin`
  );
  await zip.writeZipPromise(packagePath);
}

function getEntryPoints(pluginPath) {
  const entryPoints = {};
  for (const component of ['schemas', 'models']) {
    const entryPointPath = path.join(pluginPath, component, 'index.ts');
    try {
      fs.accessSync(entryPointPath, constants.F_OK | constants.R_OK);
      entryPoints[component] = entryPointPath;
    } catch {
      continue;
    }
  }

  return entryPoints;
}

function listPlugins() {
  for (const plugin of fs.readdirSync(root)) {
    const infoPath = path.join(root, plugin, 'info.json');
    let info;
    try {
      const infoFile = fs.readFileSync(infoPath, 'utf-8');
      info = JSON.parse(infoFile);
    } catch {
      info = { name: plugin };
    }

    info.path = path.join(root, plugin);
    console.log(plugin);
    console.log(
      JSON.stringify(info, null, 2).split('\n').slice(1, -1).join('\n'),
      '\n'
    );
  }
}
