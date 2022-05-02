import { BrowserWindow } from 'electron';
import fs from 'fs/promises';
import { sleep } from 'utils';

const PRINT_OPTIONS = {
  marginsType: 1, // no margin
  pageSize: 'A4',
  printBackground: true,
  printBackgrounds: true,
  printSelectionOnly: false,
};

export default async function saveHtmlAsPdf(
  html: string,
  savePath: string
): Promise<void> {
  const printWindow = getInitializedPrintWindow();

  printWindow.webContents.executeJavaScript(`
    document.body.innerHTML = \`${html}\`;
  `);

  return await new Promise((resolve) => {
    printWindow.webContents.on('did-finish-load', async () => {
      await sleep(1); // Required else pdf'll be blank.

      const data = await printWindow.webContents.printToPDF(PRINT_OPTIONS);
      await fs.writeFile(savePath, data);

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
      nodeIntegration: false,
    },
  });
  const printWindowUrl = getPrintWindowUrl();
  printWindow.loadURL(printWindowUrl);
  return printWindow;
}

function getPrintWindowUrl() {
  // @ts-ignore
  let url = global.WEBPACK_DEV_SERVER_URL as string | undefined;
  if (url) {
    url = url + 'print';
  } else {
    url = 'app://./print.html';
  }
  return url;
}
