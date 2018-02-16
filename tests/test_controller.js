const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Controller', () => {
    before(async function() {
        await helpers.initSqlite();
    });

    it('should call controller method', async () => {
        let doc = frappe.newDoc({
            doctype:'ToDo',
            subject: 'test'
        });
        doc.trigger('validate');
        assert.equal(doc.status, 'Open');
    });
});