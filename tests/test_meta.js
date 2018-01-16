const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Meta', () => {
    before(async function() {
        await helpers.init_sqlite();
    });

    it('should get init from json file', () => {
        let todo = frappe.get_meta('ToDo');
        assert.equal(todo.issingle, 0);
    });

    it('should get fields from meta', () => {
        let todo = frappe.get_meta('ToDo');
        let fields = todo.fields.map((df) => df.fieldname);
        assert.ok(fields.includes('subject'));
        assert.ok(fields.includes('description'));
        assert.ok(fields.includes('status'));
    });
});