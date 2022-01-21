import { BrowserWindow } from 'electron';
import { sleep } from 'frappe/utils';
import fs from 'fs/promises';

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

  return await new Promise((resolve) => {
    printWindow.webContents.on('did-finish-load', async () => {
      await sleep(1); // Required else pdf'll be blank.

      const data = await printWindow.webContents.printToPDF(PRINT_OPTIONS);
      await fs.writeFile(savePath, data, (error) => {
        if (error) throw error;
      });

      resolve();
    });
  });
}

function getInitializedPrintWindow() {
  const printWindow = new BrowserWindow({
    width: 595,
    height: 842,
    show: false,
    webPreferences: {
      contextIsolation: false,
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
