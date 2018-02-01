const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Controller', () => {
    before(async function() {
        await helpers.init_sqlite();
    });

    it('should call controller method', async () => {
        let doc = frappe.new_doc({
            doctype:'ToDo',
            subject: 'test'
        });
        doc.trigger('validate');
        assert.equal(doc.status, 'Open');
    });
});