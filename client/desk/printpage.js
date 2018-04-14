const frappe = require('frappejs');
const Page = require('frappejs/client/view/page');
const { getHTML } = require('frappejs/common/print');
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

        this.addButton(frappe._('PDF'), 'secondary', async () => {
            frappe.getPDF(this.doctype, this.name);
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
        let doc = await frappe.getDoc(this.doctype, this.name);
        frappe.desk.setActiveDoc(doc);
        const html = await getHTML(this.doctype, this.name);
        try {
            this.body.innerHTML = html;
            // this.setTitle(doc.name);
        } catch (e) {
            this.renderError('Template Error', e);
            throw e;
        }
    }
}
