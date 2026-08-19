// App is tagged with a .mjs extension to allow
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
// const root = path.join(dirname, '..', '..');
const root = dirname; // redundant, but is meant to keep with the previous line
const buildDirPath = path.join(root, 'dist_electron', 'build');
const packageDirPath = path.join(root, 'dist_electron', 'bundled');

const frappeBooksConfig = {
  productName: 'Frappe Books',
  appId: 'io.frappe.books',
  artifactName: '${productName}-v${version}-${os}-${arch}.${ext}',
  asarUnpack: '**/*.node',
  extraResources: [
    { from: 'log_creds.txt', to: '../creds/log_creds.txt' },
    { from: 'translations', to: '../translations' },
    { from: 'templates', to: '../templates' },
  ],
  files: '**',
  extends: null,
  directories: {
    output: packageDirPath,
    app: buildDirPath,
  },
  mac: {
    type: 'distribution',
    artifactName: '${productName}-v${version}-mac-${arch}.${ext}',
    category: 'public.app-category.finance',
    icon: 'build/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    darkModeSupport: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    publish: ['github'],
  },
  win: {
    artifactName: '${productName}-v${version}-windows-${arch}.${ext}',
    icon: 'build/icon.ico',
    publish: ['github'],
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32'],
      },
      {
        target: 'portable',
        arch: ['x64', 'ia32'],
      },
    ],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/installericon.ico',
    uninstallerIcon: 'build/uninstallericon.ico',
    publish: ['github'],
  },
  linux: {
    icon: 'build/icons',
    artifactName: '${productName}-v${version}-linux-${arch}.${ext}',
    category: 'Finance',
    publish: ['github'],
    target: [
      {
        target: 'deb',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'AppImage',
        arch: ['x64'],
      },
      {
        target: 'rpm',
        arch: ['x64', 'arm64'],
      },
    ],
  },
};

export default frappeBooksConfig;
