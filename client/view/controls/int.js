const FloatControl = require('./float');

class IntControl extends FloatControl {
    parse(value) {
        value = parseInt(value);
        return isNaN(value) ? 0 : value;
    }
};

module.exports = IntControl;