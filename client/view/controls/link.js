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
            this.awesomplete.list = await this.get_list(this.input.value);
        });
    }

    async get_list(query) {
        return (await frappe.db.getAll({
            doctype: this.target,
            filters: this.get_filters(query),
            limit: 50
        })).map(d => d.name);
    }

    get_filters(query) {
        return { keywords: ["like", query] }
    }
};

module.exports = LinkControl;