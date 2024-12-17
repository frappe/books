import fs from 'fs';
import path from 'path';

/**
 * Common ESBuild config used for building main process source
 * code for both dev and production.
 *
 * @param {string} root
 * @returns {import('esbuild').BuildOptions}
 */
export function getMainProcessCommonConfig(root) {
  return {
    entryPoints: [
      path.join(root, 'main.ts'),
      path.join(root, 'main', 'preload.ts'),
    ],
    bundle: true,
    sourcemap: true,
    sourcesContent: false,
    platform: 'node',
    target: 'node20',
    external: ['knex', 'electron', 'better-sqlite3', 'electron-store'],
    plugins: [excludeVendorFromSourceMap],
    write: true,
  };
}

/**
 * ESBuild plugin used to prevent source maps from being generated for
 * packages inside node_modules, only first-party code source maps
 * are to be included.
 *
 * Note, this is used only for the main process source code.
 *
 * source: https://github.com/evanw/esbuild/issues/1685#issuecomment-944916409
 * @type {import('esbuild').Plugin}
 */
export const excludeVendorFromSourceMap = {
  name: 'excludeVendorFromSourceMap',
  setup(build) {
    build.onLoad({ filter: /node_modules/ }, (args) => {
      if (args.path.endsWith('.json')) {
        return;
      }

      return {
        contents:
          fs.readFileSync(args.path, 'utf8') +
          '\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==',
        loader: 'default',
      };
    });
  },
};
