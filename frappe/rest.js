const frappe = require('frappe-core');

module.exports = {
	setup(app) {
		// get list
		app.get('/api/resource/:doctype', function(request, response) {
			return response.json(frappe.db.get_all(request.params.doctype, ['name', 'subject'], null,
				start = request.params.start || 0, limit = request.params.limit || 20));
		});

		// create
		app.post('/api/resource/:doctype', function(request, response) {
			data = request.body;
			data.doctype = request.params.doctype;
			let doc = frappe.get_doc(data).insert();
			frappe.db.write();
			return response.json(doc.get_valid_dict());
		});

		// get list
		app.get('/api/resource/:doctype/:name', function(request, response) {
			let data = frappe.get_doc(request.params.doctype, request.params.name).get_valid_dict();
			console.log(data);
			return response.json(data);
		});
	}
};
