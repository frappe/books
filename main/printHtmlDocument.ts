import { App, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { saveHtmlAsPdf } from './saveHtmlAsPdf';

export async function printHtmlDocument(
  html: string,
  app: App,
  width: number,
  height: number
): Promise<boolean> {
  const tempRoot = app.getPath('temp');
  const pdfPath = path.join(tempRoot, `frappe-books-print-${Date.now()}.pdf`);

  if (process.platform === 'linux') {
    // Electron's CUPS integration is unreliable on Linux/Wayland.
    // Instead, generate a PDF using the existing saveHtmlAsPdf flow
    // (which is known to work) and open it with the system PDF viewer.
    // The user can then print from the viewer using the OS print stack.
    let success: boolean;
    try {
      success = await Promise.race([
        saveHtmlAsPdf(html, pdfPath, app, width, height),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('saveHtmlAsPdf timed out after 15s')),
            15000
          )
        ),
      ]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[print] saveHtmlAsPdf failed or timed out:', err);
      return false;
    }

    if (!success) {
      return false;
    }

    // Fire-and-forget: do not await shell.openPath — it can hang indefinitely
    // under Flatpak/XDG portals. The IPC reply is sent immediately and the
    // PDF viewer opens asynchronously.
    // Intentionally not deleting pdfPath — the viewer needs it to remain
    // on disk. Temp-dir cleanup is left to the OS.
    void shell.openPath(pdfPath).then((openErr) => {
      if (openErr) {
        // eslint-disable-next-line no-console
        console.error('[print] shell.openPath failed:', openErr);
      }
    });
    return true;
  }

  // Non-Linux: write HTML to a temp file, load it in a hidden window,
  // and use Electron's native print dialog.
  const { getInitializedPrintWindow } = await import('./saveHtmlAsPdf');
  const tempFile = path.join(tempRoot, 'temp-print.html');
  await fs.writeFile(tempFile, html, { encoding: 'utf-8' });

  let printWindow: BrowserWindow | undefined;
  try {
    printWindow = await getInitializedPrintWindow(tempFile, width, height);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[print] getInitializedPrintWindow failed:', err);
    await fs.unlink(tempFile).catch(() => null);
    return false;
  }

  if (!printWindow) {
    await fs.unlink(tempFile).catch(() => null);
    return false;
  }

  // Capture as a const so TypeScript can safely narrow the type inside
  // the Promise callback closure without worrying about reassignment.
  const pw = printWindow;
  const success = await new Promise<boolean>((resolve) => {
    pw.webContents.print(
      { silent: false, printBackground: true },
      (succeeded: boolean) => {
        resolve(succeeded);
      }
    );
  });

  printWindow.close();
  await fs.unlink(tempFile).catch(() => null);
  return success;
}
