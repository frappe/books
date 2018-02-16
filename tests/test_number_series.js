const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');
const model = require('frappejs/model')

describe('NumberSeries', () => {
    before(async function() {
        await helpers.initSqlite();
    });

    it('should start a series and get next value', async () => {
        frappe.db.delete('NumberSeries', 'test-series-')
        assert.equal(await model.getSeriesNext('test-series-'), 'test-series-1');
        assert.equal(await model.getSeriesNext('test-series-'), 'test-series-2');
        assert.equal(await model.getSeriesNext('test-series-'), 'test-series-3');
    });
});