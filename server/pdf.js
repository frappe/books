const puppeteer = require('puppeteer');

module.exports = async function (html, filepath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({
        path: filepath,
        format: 'A4'
    });
    await browser.close();
}
