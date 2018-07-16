import frappe from 'frappejs';
import path from 'path';
import { remote, shell } from 'electron';
import { writeFile } from 'frappejs/server/utils';
import { getHTML } from 'frappejs/common/print.js';
import { DateTime } from 'luxon';
import { getSettings } from './settings';

async function getPDF(doctype, name) {

  let printTemplate = await getHTML(doctype, name);

  // Open a hidden window
  let printWindow = new remote.BrowserWindow(
    {show: false}
  );

  printWindow.loadURL(`file://${__static}/print.html`);

  printWindow.on("closed", () => {
    printWindow = null;
  });

  const code = `
    document.body.innerHTML = \`${printTemplate}\`;
  `;

  const settings = getSettings();

  printWindow.webContents.executeJavaScript(code);

  printWindow.webContents.on('did-finish-load', () => {
    const filename = name + '_' + DateTime.local().toISODate() + '.pdf';
    const pdfPath = path.resolve(path.dirname(settings.lastDbPath), filename);

    // Use default printing options
    printWindow.webContents.printToPDF({}, async (error, data) => {
      if (error) throw error;
      printWindow.close();
      await writeFile(pdfPath, data);
      shell.openExternal('file://' + pdfPath);
    });
  })
}

frappe.getPDF = getPDF;
