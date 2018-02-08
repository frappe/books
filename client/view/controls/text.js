const BaseControl = require('./base');

class TextControl extends BaseControl {
    makeInput() {
        this.input = frappe.ui.add('textarea', 'form-control', this.get_input_parent());
    }
    make() {
        super.make();
        this.input.setAttribute('rows', '8');
    }
};

module.exports = TextControl;