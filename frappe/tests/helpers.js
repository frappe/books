const frappe = require('frappe-core');

module.exports = {
	async init_sqlite() {
		await frappe.init();
		await frappe.init_db('sqlite', {db_path: 'test.db'});
		await frappe.db.migrate();
	}
}