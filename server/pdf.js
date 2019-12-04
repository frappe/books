const frappe = require('frappejs');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { getTmpDir } = require('frappejs/server/utils');
const { getHTML } = require('frappejs/common/print');
const { getRandomString } = require('frappejs/utils');

async function makePDF(html, filepath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.addStyleTag({
    url:
      'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
  });
  await page.pdf({
    path: filepath,
    format: 'A4'
  });
  await browser.close();
}

async function getPDFForElectron(doctype, name, destination, htmlContent) {
  const { remote, shell } = require('electron');
  const { BrowserWindow } = remote;
  const html = htmlContent || (await getHTML(doctype, name));
  if (!destination) {
    let folder =
      process.env.NODE_ENV === 'development'
        ? path.resolve('.')
        : remote.getGlobal('documentsPath');
    destination = path.join(folder, `${name}.pdf`);
  }

  const fs = require('fs');
  let printWindow = new BrowserWindow({
    width: 600,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  let url;
  if (process.env.NODE_ENV === 'development') {
    url = `http://localhost:${process.env.PORT}/static/print.html`;
  } else {
    let printPath = path.join(
      remote.app.getAppPath(),
      'dist',
      'electron',
      'static',
      'print.html'
    );
    url = `file://${printPath}`;
  }

  printWindow.loadURL(url);

  printWindow.on('closed', () => {
    printWindow = null;
  });

  const code = `
    let el = document.querySelector('.printTarget');
    document.body.innerHTML = \`${html}\`;
  `;

  printWindow.webContents.executeJavaScript(code);

  const printPromise = new Promise(resolve => {
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.printToPDF(
        {
          marginsType: 1, // no margin
          pageSize: 'A4',
          printBackground: true
        },
        (error, data) => {
          if (error) throw error;
          printWindow.close();
          fs.writeFile(destination, data, error => {
            if (error) throw error;
            resolve(shell.openItem(destination));
          });
        }
      );
    });
  });

  await printPromise;
}

function setupExpressRoute() {
  if (!frappe.app) return;
  frappe.app.post('/api/method/pdf', frappe.asyncHandler(handlePDFRequest));
}

async function handlePDFRequest(req, res) {
  const args = req.body;
  const { doctype, name } = args;
  const html = await getHTML(doctype, name);

  const filepath = path.join(
    getTmpDir(),
    `frappe-pdf-${getRandomString()}.pdf`
  );
  await makePDF(html, filepath);

  const file = fs.createReadStream(filepath);
  const stat = fs.statSync(filepath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${path.basename(filepath)}`
  );
  file.pipe(res);
}

module.exports = {
  makePDF,
  setupExpressRoute,
  getPDFForElectron
};
