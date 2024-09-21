// eslint-disable-next-line
require('source-map-support').install({
  handleUncaughtException: false,
  environment: 'node',
});

import { emitMainProcessError } from 'backend/helpers';
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  protocol,
  ProtocolRequest,
  ProtocolResponse,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import path from 'path';
import registerAppLifecycleListeners from './main/registerAppLifecycleListeners';
import registerAutoUpdaterListeners from './main/registerAutoUpdaterListeners';
import registerIpcMainActionListeners from './main/registerIpcMainActionListeners';
import registerIpcMainMessageListeners from './main/registerIpcMainMessageListeners';
import registerProcessListeners from './main/registerProcessListeners';

export class Main {
  title = 'Frappe Books';
  icon: string;

  winURL = '';
  checkedForUpdate = false;
  mainWindow: BrowserWindow | null = null;

  WIDTH = 1200;
  HEIGHT = process.platform === 'win32' ? 826 : 800;

  constructor() {
    this.icon = this.isDevelopment
      ? path.resolve('./build/icon.png')
      : path.join(__dirname, 'icons', '512x512.png');

    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } },
    ]);

    if (this.isDevelopment) {
      autoUpdater.logger = console;
    }

    // https://github.com/electron-userland/electron-builder/issues/4987
    app.commandLine.appendSwitch('disable-http2');
    autoUpdater.requestHeaders = {
      'Cache-Control':
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    };

    this.registerListeners();
    if (this.isMac && this.isDevelopment) {
      app.dock.setIcon(this.icon);
    }
  }

  get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  get isTest() {
    return !!process.env.IS_TEST;
  }

  get isMac() {
    return process.platform === 'darwin';
  }

  get isLinux() {
    return process.platform === 'linux';
  }

  registerListeners() {
    registerIpcMainMessageListeners(this);
    registerIpcMainActionListeners(this);
    registerAutoUpdaterListeners(this);
    registerAppLifecycleListeners(this);
    registerProcessListeners(this);
  }

  getOptions(): BrowserWindowConstructorOptions {
    const preload = path.join(__dirname, 'main', 'preload.js');
    const options: BrowserWindowConstructorOptions = {
      width: this.WIDTH,
      height: this.HEIGHT,
      title: this.title,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 16, y: 16 },
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        preload,
      },
      autoHideMenuBar: true,
      frame: !this.isMac,
      resizable: true,
    };

    if (this.isDevelopment || this.isLinux) {
      Object.assign(options, { icon: this.icon });
    }

    if (this.isLinux) {
      Object.assign(options, {
        icon: path.join(__dirname, '/icons/512x512.png'),
      });
    }

    return options;
  }

  async createWindow() {
    const options = this.getOptions();
    this.mainWindow = new BrowserWindow(options);

    if (this.isDevelopment) {
      this.setViteServerURL();
    } else {
      this.registerAppProtocol();
    }

    await this.mainWindow.loadURL(this.winURL);
    if (this.isDevelopment && !this.isTest) {
      this.mainWindow.webContents.openDevTools();
    }

    this.setMainWindowListeners();
  }

  setViteServerURL() {
    let port = 6969;
    let host = '0.0.0.0';

    if (process.env.VITE_PORT && process.env.VITE_HOST) {
      port = Number(process.env.VITE_PORT);
      host = process.env.VITE_HOST;
    }

    // Load the url of the dev server if in development mode
    this.winURL = `http://${host}:${port}/`;
  }

  registerAppProtocol() {
    protocol.registerBufferProtocol('app', bufferProtocolCallback);

    // Use the registered protocol url to load the files.
    this.winURL = 'app://./index.html';
  }

  setMainWindowListeners() {
    if (this.mainWindow === null) {
      return;
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.webContents.on('did-fail-load', () => {
      this.mainWindow!.loadURL(this.winURL).catch((err) =>
        emitMainProcessError(err)
      );
    });
  }
}

/**
 * Callback used to register the custom app protocol,
 * during prod, files are read and served by using this
 * protocol.
 */
function bufferProtocolCallback(
  request: ProtocolRequest,
  callback: (response: ProtocolResponse) => void
) {
  const { pathname, host } = new URL(request.url);
  const filePath = path.join(
    __dirname,
    'src',
    decodeURI(host),
    decodeURI(pathname)
  );

  fs.readFile(filePath, (_, data) => {
    const extension = path.extname(filePath).toLowerCase();
    const mimeType =
      {
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
      }[extension] ?? '';

    callback({ mimeType, data });
  });
}

export default new Main();
