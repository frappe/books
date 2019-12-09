const frappe = require('frappejs');
const fs = require('fs');
const path = require('path');
const { getTmpDir } = require('frappejs/server/utils');
const { getHTML } = require('frappejs/common/print');
const { getRandomString } = require('frappejs/utils');

async function makePDF(html, filepath) {
  const puppeteer = require('puppeteer-core');
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
  setupExpressRoute
};
