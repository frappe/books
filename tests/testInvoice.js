const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('frappejs/tests/helpers');
const models = require('../models');

async function makeFixtures() {
    if (!(await frappe.db.exists('Party', 'Test Customer'))) {
        await frappe.insert({doctype:'Party', name:'Test Customer'})
        await frappe.insert({doctype:'Item', name:'Test Item 1', description:'Test Item Description 1', unit:'No', rate: 100})
        await frappe.insert({doctype:'Item', name:'Test Item 2', description:'Test Item Description 2', unit:'No', rate: 200})
        await frappe.insert({doctype:'Account', name:'GST', parent_account: 'Liabilities'});
        await frappe.insert({doctype:'Tax', name:'GST',
            details: [{account: 'GST', rate:10}]
        })
    }
}

describe('Invoice', () => {
    before(async function() {
        await helpers.initSqlite({models: models});
        await makeFixtures();
    });

    it('show create an invoice', async () => {
        let invoice = await frappe.insert({
            doctype:'Invoice',
            customer: 'Test Customer',
            items: [
                {item: 'Test Item 1', quantity: 5},
                {item: 'Test Item 2', quantity: 7},
            ]
        });

        assert.equal(invoice.items[0].amount, 500);
        assert.equal(invoice.items[1].amount, 1400);
        assert.equal(invoice.netTotal, 1900);
    });

    it('show create an invoice with tax', async () => {
        let invoice = await frappe.insert({
            doctype:'Invoice',
            customer: 'Test Customer',
            items: [
                {item: 'Test Item 1', quantity: 5, tax: 'GST'},
                {item: 'Test Item 2', quantity: 7, tax: 'GST'},
            ]
        });

        assert.equal(invoice.items[0].amount, 500);
        assert.equal(invoice.items[1].amount, 1400);
        assert.equal(invoice.netTotal, 1900);
        assert.equal(invoice.taxes[0].amount, 190);
        assert.equal(invoice.grandTotal, 2090);
    });

});