'use strict';

import { app, protocol, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib';
import theme from '@/theme';
import { getMainWindowSize } from './screenSize';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let winURL;
let checkedForUpdate = false;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

function createWindow() {
  // Create the browser window.
  let { width, height } = getMainWindowSize();
  mainWindow = new BrowserWindow({
    vibrancy: 'sidebar',
    transparent: isMac,
    backgroundColor: '#80FFFFFF',
    width,
    height,
    webPreferences: {
      nodeIntegration: true
    },
    frame: isLinux,
    resizable: true
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    winURL = process.env.WEBPACK_DEV_SERVER_URL;
    mainWindow.loadURL(winURL);
    // to share with renderer process
    global.WEBPACK_DEV_SERVER_URL = process.env.WEBPACK_DEV_SERVER_URL;
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    winURL = 'app://./index.html';
    mainWindow.loadURL(winURL);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow(tab = 'General') {
  let settingsWindow = new BrowserWindow({
    parent: mainWindow,
    frame: isLinux,
    width: 460,
    height: 577,
    backgroundColor: theme.backgroundColor.gray['200'],
    webPreferences: {
      nodeIntegration: true
    },
    resizable: false
  });

  settingsWindow.loadURL(`${winURL}#/settings/${tab}`);
}

ipcMain.on('check-for-updates', () => {
  if (!isDevelopment && !checkedForUpdate) {
    autoUpdater.checkForUpdatesAndNotify();
    checkedForUpdate = true;
  }
});

ipcMain.on('open-settings-window', (event, tab) => {
  createSettingsWindow(tab);
});

ipcMain.on('reload-main-window', () => {
  mainWindow.reload();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools();
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
