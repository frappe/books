const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Models', () => {
    before(async function() {
        await helpers.init_sqlite();
    });

    it('should get todo json', () => {
        let todo = frappe.getMeta('todo');
        assert.equal(todo.isSingle, 0);
    });
});