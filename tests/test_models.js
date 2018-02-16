const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Models', () => {
    before(async function() {
        await helpers.initSqlite();
    });

    it('should get todo json', () => {
        let todo = frappe.getMeta('ToDo');
        assert.equal(todo.isSingle, 0);
    });
});