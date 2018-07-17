const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');
const naming = require('frappejs/model/naming')

describe('Naming', () => {
    before(async function() {
        await helpers.initSqlite();
    });

    it('should start a series and get next value', async () => {
        frappe.db.delete('NumberSeries', 'test-series-')
        assert.equal(await naming.getSeriesNext('test-series-'), 'test-series-1001');
        assert.equal(await naming.getSeriesNext('test-series-'), 'test-series-1002');
        assert.equal(await naming.getSeriesNext('test-series-'), 'test-series-1003');
    });

    it('should set name by autoincrement', async () => {
        const todo1 = await frappe.insert({doctype: 'ToDo', subject: 'naming test'});
        const todo2 = await frappe.insert({doctype: 'ToDo', subject: 'naming test'});
        assert.equal(parseInt(todo1.name) + 1, parseInt(todo2.name));
    });

});