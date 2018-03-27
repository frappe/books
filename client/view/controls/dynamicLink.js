const LinkControl = require('./link');

class DynamicLinkControl extends LinkControl {
    getTarget() {
        return this.doc[this.references];
    }
};

module.exports = DynamicLinkControl;