const BaseControl = require('./base');

class DataControl extends BaseControl {
    make() {
        super.make();

        if (!this.inputType) {
            this.inputType = 'text';
        }
        this.input.setAttribute('type', this.inputType);
    }
};

module.exports = DataControl;