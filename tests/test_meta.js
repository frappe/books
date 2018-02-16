const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Meta', () => {
    before(async function() {
        await helpers.initSqlite();
    });

    it('should get init from json file', () => {
        let todo = frappe.getMeta('ToDo');
        assert.equal(todo.isSingle, 0);
    });

    it('should get fields from meta', () => {
        let todo = frappe.getMeta('ToDo');
        let fields = todo.fields.map((df) => df.fieldname);
        assert.ok(fields.includes('subject'));
        assert.ok(fields.includes('description'));
        assert.ok(fields.includes('status'));
    });
});