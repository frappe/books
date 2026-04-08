import { App, shell } from 'electron';
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

  if (process.platform === 'linux') {
    // Electron's CUPS integration returns no printers on Linux/Wayland —
    // webContents.print() opens a dialog with an empty printer list and
    // resolves immediately without printing anything. Work around this by
    // generating a PDF with printToPDF() (which works correctly) and
    // opening it with the system PDF viewer via shell.openPath(). The
    // user can then print from the viewer using the OS print stack.
    const pdfPath = path.join(tempRoot, `frappe-books-print-${Date.now()}.pdf`);
    const pdfData = await printWindow.webContents.printToPDF({
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      pageSize: {
        height: height / 2.54, // centimetres → inches
        width: width / 2.54,
      },
      printBackground: true,
    });
    await fs.writeFile(pdfPath, pdfData);
    printWindow.close();
    await fs.unlink(tempFile);
    // Intentionally not deleting pdfPath — the viewer needs it to remain
    // on disk. Temp-dir cleanup is left to the OS.
    await shell.openPath(pdfPath);
    return true;
  }

  const success = await new Promise<boolean>((resolve) => {
    printWindow.webContents.print(
      { silent: false, printBackground: true },
      (success, _failureReason) => {
        resolve(success);
      }
    );
  });

  printWindow.close();
  await fs.unlink(tempFile);
  return success;
}
