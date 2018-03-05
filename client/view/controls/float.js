const BaseControl = require('./base');

class FloatControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        this.input.classList.add('text-right');
        this.input.addEventListener('focus', () => {
            setTimeout(() => {
                this.input.select();
            }, 100);
        })
    }
    parse(value) {
        value = parseFloat(value);
        return isNaN(value) ? 0 : value;
    }
};

module.exports = FloatControl;