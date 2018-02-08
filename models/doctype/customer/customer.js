const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class CustomerMeta extends BaseMeta {
    setupMeta() {
        Object.assign(this, require('./customer.json'));
    }
}

class Customer extends BaseDocument {
}

module.exports = {
    Document: Customer,
    Meta: CustomerMeta
};
