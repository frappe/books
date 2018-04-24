const frappe = require('frappejs');
const BaseControl = require('./base');
const Awesomplete = require('awesomplete');

class LinkControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        this.setupAwesomplete();
    }

    setupAwesomplete() {
        this.awesomplete = new Awesomplete(this.input, {
            minChars: 0,
            maxItems: 99,
            filter: () => true,
            sort: (a, b) => {
                if (a.value === '__newitem' || b.value === '__newitem') {
                    return -1;
                }
                return a.value > b.value;
            }
        });

        // rebuild the list on input
        this.input.addEventListener('input', async (event) => {
            let list = await this.getList(this.input.value);

            // action to add new item
            list.push({
                label: frappe._('+ New {0}', this.label),
                value: '__newItem',
            });

            this.awesomplete.list = list;
        });

        // new item action
        this.input.addEventListener('awesomplete-select', async (e) => {
            if (e.text && e.text.value === '__newItem') {
                e.preventDefault();
                const newDoc = await frappe.getNewDoc(this.getTarget());
                const formModal = await frappe.desk.showFormModal(this.getTarget(), newDoc.name);
                if (formModal.form.doc.meta.hasField('name')) {
                    formModal.form.doc.set('name', this.input.value);
                }

                formModal.once('save', async () => {
                    await this.updateDocValue(formModal.form.doc.name);
                });
            }
        });

    }

    async getList(query) {
        return (await frappe.db.getAll({
            doctype: this.getTarget(),
            filters: this.getFilters(query, this),
            limit: 50
        })).map(d => d.name);
    }

    getFilters(query) {
        return { keywords: ["like", query] }
    }

    getTarget() {
        return this.target;
    }
};

module.exports = LinkControl;