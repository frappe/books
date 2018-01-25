const BaseControl = require('./base');

class FloatControl extends BaseControl {
    make() {
        super.make();
		this.input.setAttribute('type', 'text');
		this.input.classList.add('text-right');
    }
};

module.exports = FloatControl;