const frappe = require('frappe-core');

module.exports = {
	setup(app) {
		// get list
		app.get('/api/resource/:doctype', async function(request, response) {
			try {
				let fields, filters;
				for (key of ['fields', 'filters']) {
					if (request.params[key]) {
						request.params[key] = JSON.parse(request.params[key]);
					}
				}

				let data = await frappe.db.get_all({
					doctype: request.params.doctype,
					fields: request.params.fields || ['name', 'subject'],
					filters: request.params.filters,
					start: request.params.start || 0,
					limit: request.params.limit || 20,
					order_by: request.params.order_by,
					order: request.params.order
				});

				return response.json(data);
			} catch (e) {
				throw e;
			}
		});

		// create
		app.post('/api/resource/:doctype', async function(request, response) {
			try {
				data = request.body;
				data.doctype = request.params.doctype;
				let doc = await frappe.get_doc(data);
				await doc.insert();
				await frappe.db.commit();
				return response.json(doc.get_valid_dict());
			} catch (e) {
				throw e;
			}
		});

		// update
		app.put('/api/resource/:doctype/:name', async function(request, response) {
			try {
				data = request.body;
				let doc = await frappe.get_doc(request.params.doctype, request.params.name);
				Object.assign(doc, data);
				await doc.update();
				await frappe.db.commit();
				return response.json(doc.get_valid_dict());
			} catch (e) {
				throw e;
			}
		});


		// get document
		app.get('/api/resource/:doctype/:name', async function(request, response) {
			try {
				let doc = await frappe.get_doc(request.params.doctype, request.params.name);
				return response.json(doc.get_valid_dict());
			} catch (e) {
				throw e;
			}
		});

		// delete
		app.delete('/api/resource/:doctype/:name', async function(request, response) {
			try {
				let doc = await frappe.get_doc(request.params.doctype, request.params.name)
				await doc.delete();
				return response.json({});
			} catch (e) {
				throw e;
			}
		});

	}
};
