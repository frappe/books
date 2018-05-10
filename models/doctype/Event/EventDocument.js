const frappe = require('frappejs');
const BaseDocument = require('frappejs/model/document');

module.exports = class Event extends BaseDocument {
    alertEvent() {
        alert(this.title);
    }
}
