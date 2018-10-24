const { app, BrowserWindow } = require('electron');
const setupMenu = require('./menu');

let mainWindow
let winURL

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
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
    width: 1024,
    height: 768,
    useContentSize: true,
    webPreferences: {
      webSecurity: false
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  setupMenu();
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// TODO:
// Enable Auto Update
// https://www.electron.build/auto-update/
