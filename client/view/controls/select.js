const BaseControl = require('./base');
const frappe = require('frappejs');

class SelectControl extends BaseControl {
    makeInput() {
        this.input = frappe.ui.add('select', 'form-control', this.getInputParent());
        this.addOptions();
    }

    refresh() {
        this.addOptions();
        super.refresh();
    }

    addOptions() {
        const options = this.getOptions();
        if (this.areOptionsSame(options)) return;

        frappe.ui.empty(this.input);
        for (let value of options) {
            let option = frappe.ui.add('option', null, this.input, value.label || value);
            option.setAttribute('value', value.value || value);
        }
        this.lastOptions = options;
    }

    getOptions() {
        let options = this.options;
        if (typeof options==='string') {
            options = options.split('\n');
        }
        return options;
    }

    areOptionsSame(options) {
        let same = false;
        if (this.lastOptions && options.length===this.lastOptions.length) {
            same = options.every((v ,i) => {
                const v1 = this.lastOptions[i];
                return (v.value || v) === (v1.value || v1)
            });
        }
        return same;
    }

    make() {
        super.make();
        this.input.setAttribute('row', '3');
    }
};

module.exports = SelectControl;