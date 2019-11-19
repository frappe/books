const { app, BrowserWindow, ipcMain } = require('electron');
const setupMenu = require('./menu');
const theme = require('../src/theme');

let mainWindow;
let winURL;

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\');
  global.documentsPath = app.getPath('documents');
}

if (process.env.NODE_ENV === 'development') {
  const { getAppConfig } = require('frappejs/webpack/utils');
  const appConfig = getAppConfig();
  winURL = `http://localhost:${appConfig.dev.devServerPort}`;
} else {
  winURL = `file://${__dirname}/index.html`;
}

function createWindow() {
  /**
   * Initial window options
   */

  mainWindow = new BrowserWindow({
    vibrancy: 'sidebar',
    transparent: true,
    backgroundColor: '#80FFFFFF',
    width: 1200,
    height: 907,
    frame: false,
    resizable: false,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(winURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupMenu();
}

function createSettingsWindow(tab = 'General') {
  let settingsWindow = new BrowserWindow({
    parent: mainWindow,
    frame: false,
    width: 460,
    height: 577,
    backgroundColor: theme.backgroundColor.gray['200'],
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });

  settingsWindow.loadURL(`${winURL}/#/settings/${tab}`);
}

ipcMain.on('open-settings-window', tab => {
  createSettingsWindow(tab);
});

ipcMain.on('reload-main-window', () => {
  mainWindow.reload();
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// TODO:
// Enable Auto Update
// https://www.electron.build/auto-update/
