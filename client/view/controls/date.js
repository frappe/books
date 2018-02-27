const flatpickr = require('flatpickr');
const BaseControl = require('./base');
const frappe = require('frappejs');

class DateControl extends BaseControl {
    make() {
        let dateFormat = {
            'yyyy-mm-dd': 'Y-m-d',
            'dd/mm/yyyy': 'd/m/Y',
            'dd-mm-yyyy': 'd-m-Y',
            'mm/dd/yyyy': 'm/d/Y',
            'mm-dd-yyyy': 'm-d-Y'
        }
        let altFormat = dateFormat[frappe.SystemSettings.dateFormat];

        super.make();
        this.input.setAttribute('type', 'text');
        this.flatpickr = flatpickr.default(this.input, {
            altInput: true,
            altFormat: altFormat,
            dateFormat:'Y-m-d'
        });
    }

    setDisabled() {
        this.input.disabled = this.isDisabled();
        if (this.flatpickr && this.flatpickr.altInput) {
            this.flatpickr.altInput.disabled = this.isDisabled();
        }
    }

    setInputValue(value) {
        super.setInputValue(value);
        this.flatpickr.setDate(value);
    }
};

module.exports = DateControl;