const frappe = require('frappejs');
const BaseControl = require('./base');
const Awesomplete = require('awesomplete');

class LinkControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        this.awesomplete = new Awesomplete(this.input, {
            autoFirst: true,
            minChars: 0,
            maxItems: 99,
            filter: function() {
				return true;
			}
        });

        // rebuild the list on input
        this.input.addEventListener('input', async (event) => {
            let list = await this.getList(this.input.value);

            // action to add new item
            list.push({
                label:frappe._('+ New {0}', this.target),
                value: '__newItem',
                action: () => {
                }
            });

            this.awesomplete.list = list;
        });

        // new item action
        this.input.addEventListener('awesomplete-select', async (e) => {
            if (e.text && e.text.value === '__newItem') {
                e.preventDefault();
                const newDoc = await frappe.getNewDoc(this.target);
                const formModal = frappe.desk.showFormModal(this.target, newDoc.name);
                formModal.form.once('submit', () => {
                    this.form.doc.set(this.fieldname, formModal.form.doc.name);
                })
            }
        });
    }

    async getList(query) {
        return (await frappe.db.getAll({
            doctype: this.target,
            filters: this.getFilters(query),
            limit: 50
        })).map(d => d.name);
    }

    getFilters(query) {
        return { keywords: ["like", query] }
    }
};

module.exports = LinkControl;