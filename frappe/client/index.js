const common = require('frappe-core/frappe/common');
const Database = require('frappe-core/frappe/backends/rest_client').Database;
const frappe = require('frappe-core');
frappe.ui = require('./ui');
frappe.view = require('./view');
const Router = require('./view/router').Router;

module.exports = {
	async start({server, container}) {
		window.frappe = frappe;
		frappe.init();
		common.init_libs(frappe);

		frappe.db = await new Database({
			server: server,
			fetch: window.fetch.bind()
		});

		frappe.view.init({container: container});
		frappe.router = new Router();
	}
};

