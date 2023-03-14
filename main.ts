'use strict';

import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  protocol,
} from 'electron';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import registerAppLifecycleListeners from './main/registerAppLifecycleListeners';
import registerAutoUpdaterListeners from './main/registerAutoUpdaterListeners';
import registerIpcMainActionListeners from './main/registerIpcMainActionListeners';
import registerIpcMainMessageListeners from './main/registerIpcMainMessageListeners';
import registerProcessListeners from './main/registerProcessListeners';

export class Main {
  title: string = 'Frappe Books';
  icon: string;

  winURL: string = '';
  isWebpackUrl: boolean = false;
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

    Store.initRenderer();

    this.registerListeners();
    if (this.isMac && this.isDevelopment) {
      app.dock.setIcon(this.icon);
    }
  }

  get isDevelopment() {
    return process.env.NODE_ENV !== 'production';
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
    const options: BrowserWindowConstructorOptions = {
      width: this.WIDTH,
      height: this.HEIGHT,
      title: this.title,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 16, y: 16 },
      webPreferences: {
        contextIsolation: false, // TODO: Switch this off
        nodeIntegration: true,
      },
      autoHideMenuBar: true,
      frame: !this.isMac,
      resizable: true,
    };

    if (!this.isMac) {
      options.titleBarOverlay = {
        color: '#FFFFFF',
        height: 26,
      };
    }

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

  createWindow() {
    const options = this.getOptions();
    this.mainWindow = new BrowserWindow(options);

    this.isWebpackUrl = !!process.env.WEBPACK_DEV_SERVER_URL;
    if (this.isWebpackUrl) {
      this.loadWebpackDevServerURL();
    } else {
      this.loadAppUrl();
    }

    this.setMainWindowListeners();
  }

  loadWebpackDevServerURL() {
    // Load the url of the dev server if in development mode
    this.winURL = process.env.WEBPACK_DEV_SERVER_URL as string;
    this.mainWindow!.loadURL(this.winURL);

    if (this.isDevelopment && !this.isTest) {
      this.mainWindow!.webContents.openDevTools();
    }
  }

  loadAppUrl() {
    createProtocol('app');
    // Load the index.html when not in development
    this.winURL = 'app://./index.html';
    this.mainWindow!.loadURL(this.winURL);
  }

  setMainWindowListeners() {
    if (this.mainWindow === null) {
      return;
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.webContents.on('did-fail-load', () => {
      this.mainWindow!.loadURL(this.winURL);
    });
  }
}

export default new Main();
