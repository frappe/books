import { App } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { getInitializedPrintWindow } from './saveHtmlAsPdf';

export async function printHtmlDocument(
  html: string,
  app: App,
  width: number,
  height: number
): Promise<boolean> {
  const tempRoot = app.getPath('temp');
  const tempFile = path.join(tempRoot, `temp-print.html`);
  await fs.writeFile(tempFile, html, { encoding: 'utf-8' });

  const printWindow = await getInitializedPrintWindow(tempFile, width, height);

  const success = await new Promise<boolean>((resolve) => {
    printWindow.webContents.print(
      { silent: false, printBackground: true },
      (success) => resolve(success)
    );
  });

  printWindow.close();
  await fs.unlink(tempFile);
  return success;
}
