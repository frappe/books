const frappe = require('frappejs');
const puppeteer = require('puppeteer');
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
      url: 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
    })
    await page.pdf({
        path: filepath,
        format: 'A4'
    });
    await browser.close();
}

async function getPDFForElectron(doctype, name, destination, htmlContent) {
    const { remote, shell } = require('electron');
    const { BrowserWindow } = remote;
    const html = htmlContent || await getHTML(doctype, name);
    const filepath = path.join(destination, name + '.pdf');

    const fs = require('fs')
    let printWindow = new BrowserWindow({
      width: 600,
      height: 800,
      show: false
    })
    printWindow.loadURL(`file://${path.join(__static, 'print.html')}`);

    printWindow.on('closed', () => {
      printWindow = null;
    });

    const code = `
      document.body.innerHTML = \`${html}\`;
    `;

    printWindow.webContents.executeJavaScript(code);

    const printPromise = new Promise(resolve => {
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.printToPDF({}, (error, data) => {
          if (error) throw error
          printWindow.close();
          fs.writeFile(filepath, data, (error) => {
            if (error) throw error
            resolve(shell.openItem(filepath));
          })
        })
      })
    })

    await printPromise;
    // await makePDF(html, filepath);
}

function setupExpressRoute() {
    if (!frappe.app) return;
    frappe.app.post('/api/method/pdf', frappe.asyncHandler(handlePDFRequest));
}

async function handlePDFRequest(req, res) {
    const args = req.body;
    const { doctype, name } = args;
    const html = await getHTML(doctype, name);

    const filepath = path.join(getTmpDir(), `frappe-pdf-${getRandomString()}.pdf`);
    await makePDF(html, filepath);

    const file = fs.createReadStream(filepath);
    const stat = fs.statSync(filepath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filepath)}`);
    file.pipe(res);
}

module.exports = {
    makePDF,
    setupExpressRoute,
    getPDFForElectron
}
