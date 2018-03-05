const BaseControl = require('./base');
const frappe = require('frappejs');

class SelectControl extends BaseControl {
    makeInput() {
        this.input = frappe.ui.add('select', 'form-control', this.inputContainer);

        let options = this.options;
        if (typeof options==='string') {
            options = options.split('\n');
        }

        for (let value of options) {
            let option = frappe.ui.add('option', null, this.input);
            option.textContent = value;
            option.setAttribute('value', value);
        }
    }
    make() {
        super.make();
        this.input.setAttribute('row', '3');
    }
};

module.exports = SelectControl;