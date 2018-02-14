const flatpickr = require('flatpickr');
const BaseControl = require('./base');

class DateControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        flatpickr.default(this.input, {
            dateFormat: "Y-m-d"
        });
    }
};

module.exports = DateControl;