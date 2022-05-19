import { App, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const PRINT_OPTIONS = {
  marginsType: 1, // no margin
  pageSize: 'A4',
  printBackground: true,
  printBackgrounds: true,
  printSelectionOnly: false,
};

export async function saveHtmlAsPdf(
  html: string,
  savePath: string,
  app: App
): Promise<boolean> {
  /**
   * Store received html as a file in a tempdir,
   * this will be loaded into the print view
   */
  const tempRoot = app.getPath('temp');
  const filename = path.parse(savePath).name;
  const htmlPath = path.join(tempRoot, `${filename}.html`);
  await fs.writeFile(htmlPath, html, { encoding: 'utf-8' });

  const printWindow = getInitializedPrintWindow(htmlPath);

  /**
   * After the printWindow content is ready, save as pdf and
   * then close the window and delete the temp html file.
   */
  return await new Promise((resolve) => {
    printWindow.webContents.once('did-finish-load', () => {
      printWindow.webContents.printToPDF(PRINT_OPTIONS).then((data) => {
        fs.writeFile(savePath, data).then(() => {
          printWindow.close();
          fs.unlink(htmlPath).then(() => {
            resolve(true);
          });
        });
      });
    });
  });
}

function getInitializedPrintWindow(printFilePath: string) {
  const printWindow = new BrowserWindow({
    width: 595,
    height: 842,
    show: false,
  });

  printWindow.loadFile(printFilePath);
  return printWindow;
}
