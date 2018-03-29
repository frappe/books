const BaseControl = require('./base');

class FileControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'file');
    }
};

module.exports = FileControl;