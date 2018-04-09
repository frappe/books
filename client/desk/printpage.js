const Page = require('frappejs/client/view/page');
const frappe = require('frappejs');
const nunjucks = require('nunjucks/browser/nunjucks');

nunjucks.configure({ autoescape: false });

module.exports = class PrintPage extends Page {
    constructor(doctype) {
        let meta = frappe.getMeta(doctype);
        super({title: `${meta.name}`, hasRoute: true});
        this.meta = meta;
        this.doctype = doctype;
        this.titleElement.classList.add('hide');

        this.addButton(frappe._('Edit'), 'primary', () => {
            frappe.router.setRoute('edit', this.doctype, this.name)
        });

        this.addButton(frappe._('Print'), 'secondary', async () => {
            const pdf = require('frappejs/server/pdf');
            const savePath = '/Users/farisansari/frappe.pdf';
            pdf(await this.getHTML(true), savePath);
            const { shell } = require('electron');
            shell.openItem(savePath);
        });
    }

    async show(params) {
        super.show();
        this.name = params.name;
        if (this.meta.print) {
            // render
            this.renderTemplate();
        } else {
            this.renderError('No Print Settings');
        }
    }

    async renderTemplate() {
        try {
            this.body.innerHTML = await this.getHTML();
            // this.setTitle(doc.name);
        } catch (e) {
            this.renderError('Template Error', e);
            throw e;
        }
    }

    async getHTML(pdf = false) {
        this.printFormat = await frappe.getDoc('PrintFormat', this.meta.print.printFormat);
        let doc = await frappe.getDoc(this.doctype, this.name);
        let context = {doc: doc, frappe: frappe};
        frappe.desk.setActiveDoc(doc);
        return `
        ${pdf ? `
            <style>
                ${require('fs').readFileSync('./www/dist/css/style.css').toString()}
            </style>
        ` : ''}
        <div class="print-page">
            ${nunjucks.renderString(this.printFormat.template, context)}
        </div>`;
    }
}
