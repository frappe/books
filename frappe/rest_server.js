const frappe = require('frappe-core');

module.exports = {
	setup(app) {
		// get list
		app.get('/api/resource/:doctype', async function(request, response) {
			let data = await frappe.db.get_all(request.params.doctype, ['name', 'subject'], null,
				start = request.params.start || 0, limit = request.params.limit || 20);
			return response.json(data);
		});

		// create
		app.post('/api/resource/:doctype', async function(request, response) {
			data = request.body;
			data.doctype = request.params.doctype;
			let doc = await frappe.get_doc(data)
			await doc.insert();
			await frappe.db.commit();
			return response.json(doc.get_valid_dict());
		});

		// get document
		app.get('/api/resource/:doctype/:name', async function(request, response) {
			let data = await frappe.get_doc(request.params.doctype, request.params.name).get_valid_dict();
			return response.json(data);
		});

		// delete
		app.delete('/api/resource/:doctype/:name', async function(request, response) {
			let data = await frappe.get_doc(request.params.doctype, request.params.name).delete();
			return response.json(data);
		});

	}
};
