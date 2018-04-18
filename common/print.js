const frappe = require('frappejs');
const nunjucks = require('nunjucks/browser/nunjucks');

async function getHTML(doctype, name) {
    const meta = frappe.getMeta(doctype);
    const printFormat = await frappe.getDoc('PrintFormat', meta.print.printFormat);
    let doc = await frappe.getDoc(doctype, name);
    let context = {doc: doc, frappe: frappe};

    let html;
    try {
        html = nunjucks.renderString(printFormat.template, context);
    } catch (error) {
        console.log(error);
        html = '';
    }

    return `
        <div class="print-page">
            ${html}
        </div>
    `;
}

module.exports = {
    getHTML
}
