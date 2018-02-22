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

        this.on('show', async (params) => {
            this.name = params.name;
            if (this.meta.print) {
                // render
                this.renderTemplate();
            } else {
                this.renderError('No Print Settings');
            }
        });

        this.addButton(frappe._('Edit'), 'primary', () => {
            frappe.router.setRoute('edit', this.doctype, this.name)
        });
    }

    async renderTemplate() {
        this.printFormat = await frappe.getDoc('PrintFormat', this.meta.print.printFormat);
        let doc = await frappe.getDoc(this.doctype, this.name);
        let context = {doc: doc, frappe: frappe};

        frappe.desk.setActiveDoc(doc);

        try {
            this.body.innerHTML = `<div class="print-page">${nunjucks.renderString(this.printFormat.template, context)}</div>`;
            this.setTitle(doc.name);
        } catch (e) {
            this.renderError('Template Error', e);
            throw e;
        }
    }
}
