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
            this.awesomplete.list = (await frappe.db.get_all({
                doctype: this.options,
                filters: { keywords: ["like", this.input.value] },
                limit: 50
            })).map(d => d.name);
        });
    }
};

module.exports = LinkControl;