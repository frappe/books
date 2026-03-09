// App is tagged with a .mjs extension to allow
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * electron-builder doesn't look for the APPLE_TEAM_ID environment variable for some reason.
 * This workaround allows an environment variable to be added to the electron-builder.yml config
 * collection. See: https://github.com/electron-userland/electron-builder/issues/7812
 */

const dirname = path.dirname(fileURLToPath(import.meta.url));
// const root = path.join(dirname, '..', '..');
const root = dirname; // redundant, but is meant to keep with the previous line
const buildDirPath = path.join(root, 'dist_electron', 'build');
const packageDirPath = path.join(root, 'dist_electron', 'bundled');

const frappeBooksConfig = {
  productName: 'Rare Books',
  appId: 'com.rareco.rarebooks',
  artifactName: '${productName}-v${version}-${os}-${arch}.${ext}',
  asarUnpack: '**/*.node',
  extraResources: [
    { from: '.env', to: '.env' },
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
    notarize: {
      teamId: process.env.APPLE_TEAM_ID || '',
    },
    hardenedRuntime: true,
    gatekeeperAssess: false,
    darkModeSupport: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    publish: ['github'],
  },
  win: {
    publisherName: 'Rareco Company Ltd.',
    artifactName: '${productName}-v${version}-windows-${arch}.${ext}',
    signDlls: true,
    icon: 'build/icon.ico',
    publish: ['github'],
    target: [
      {
        target: 'appx',
        arch: ['x64'],
      },
    ],
  },
  appx: {
    applicationId: 'io.rare.books',
    backgroundColor: '#464646',
    displayName: 'RareLedger',
    identityName: 'CharlesNkonoki.RareLedger',
    publisher: 'CN=2E2F9384-BEA3-4F48-B563-BCCA0871A1DF',
    publisherDisplayName: 'Charles Nkonoki',
    languages: ['en-US'],
    setBuildNumber: false,
    showNameOnTiles: true,
    addAutoLaunchExtension: false,
    electronUpdaterAware: false,
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
