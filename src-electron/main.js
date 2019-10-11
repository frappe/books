const { app, BrowserWindow } = require('electron');
const setupMenu = require('./menu');

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
