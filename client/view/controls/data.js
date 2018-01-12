const BaseControl = require('./base');

class DataControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
    }
};

module.exports = DataControl;