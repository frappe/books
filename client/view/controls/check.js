const BaseControl = require('./base');

class CheckControl extends BaseControl {
    make() {
        if (!this.onlyInput) {
            this.makeInputContainer();
        }
        this.makeInput();
        if (!this.onlyInput) {
            this.makeLabel();
        }
        this.addChangeHandler();
    }

    makeInputContainer() {
        super.makeInputContainer('form-check');
    }

    makeLabel() {
        super.makeLabel('form-check-label');
    }

    makeInput() {
        super.makeInput('form-check-input');
        this.input.type = 'checkbox';
    }

    setInputValue(value) {
        if (value === '0') value = 0;
        this.input.checked = value ? true : false;
    }

    getInputValue() {
        return this.input.checked ? 1 : 0
    }
};

module.exports = CheckControl;