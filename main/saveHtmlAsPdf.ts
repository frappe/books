import { App, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export async function saveHtmlAsPdf(
  html: string,
  savePath: string,
  app: App,
  width: number, // centimeters
  height: number // centimeters
): Promise<boolean> {
  /**
   * Store received html as a file in a tempdir,
   * this will be loaded into the print view
   */
  const tempRoot = app.getPath('temp');
  const filename = path.parse(savePath).name;
  const htmlPath = path.join(tempRoot, `${filename}.html`);
  await fs.writeFile(htmlPath, html, { encoding: 'utf-8' });

  const printWindow = getInitializedPrintWindow(htmlPath, width, height);
  const printOptions = {
    marginsType: 1, // no margin
    pageSize: {
      height: height * 10_000, // micrometers
      width: width * 10_000, // micrometers
    },
    printBackground: true,
    printBackgrounds: true,
    printSelectionOnly: false,
  };

  /**
   * After the printWindow content is ready, save as pdf and
   * then close the window and delete the temp html file.
   */
  return await new Promise((resolve) => {
    printWindow.webContents.once('did-finish-load', () => {
      printWindow.webContents.printToPDF(printOptions).then((data) => {
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

function getInitializedPrintWindow(
  printFilePath: string,
  width: number,
  height: number
) {
  const printWindow = new BrowserWindow({
    width: Math.floor(width * 28.333333), // pixels
    height: Math.floor(height * 28.333333), // pixels
    show: false,
  });

  printWindow.loadFile(printFilePath);
  return printWindow;
}
