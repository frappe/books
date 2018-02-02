const BaseControl = require('./base');

class PasswordControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'password');
    }
};

module.exports = PasswordControl;