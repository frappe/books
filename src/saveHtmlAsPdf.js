import fs from 'fs';
import { shell, BrowserWindow } from 'electron';

const PRINT_OPTIONS = {
  marginsType: 1, // no margin
  pageSize: 'A4',
  printBackground: true,
  printBackgrounds: true,
  printSelectionOnly: false,
};

export default async function makePDF(html, savePath) {
  const printWindow = getInitializedPrintWindow();

  printWindow.webContents.executeJavaScript(`
    document.body.innerHTML = \`${html}\`;
  `);

  const sleep = (m) => new Promise((r) => setTimeout(r, m));
  // TODO: Check if event 'paint' works after bumping electron.
  printWindow.webContents.on('did-finish-load', async () => {
    await sleep(1000); // Required else pdf'll be blank.
    printWindow.webContents.printToPDF(PRINT_OPTIONS).then((data) => {
      printWindow.destroy();
      fs.writeFile(savePath, data, (error) => {
        if (error) throw error;
        return shell.openItem(savePath);
      });
    });
  });
}

function getInitializedPrintWindow() {
  const printWindow = new BrowserWindow({
    width: 595,
    height: 842,
    show: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
    },
  });
  printWindow.loadURL(getPrintWindowUrl());
  return printWindow;
}

function getPrintWindowUrl() {
  let url = global.WEBPACK_DEV_SERVER_URL;
  if (url) {
    url = url + 'print';
  } else {
    url = 'app://./print.html';
  }
  return url;
}
