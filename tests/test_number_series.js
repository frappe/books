const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Number Series', () => {
    before(async function() {
        await helpers.init_sqlite();
    });

    it('should start a series and get next value', async () => {
        frappe.db.delete('Number Series', 'test-series-')
        assert.equal(await frappe.model.get_series_next('test-series-'), 'test-series-1');
        assert.equal(await frappe.model.get_series_next('test-series-'), 'test-series-2');
        assert.equal(await frappe.model.get_series_next('test-series-'), 'test-series-3');
    });
});