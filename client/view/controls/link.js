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
            maxItems: 99
        });

        // rebuild the list on input
        this.input.addEventListener('input', async (event) => {
            this.awesomplete.list = await this.getList(this.input.value);
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