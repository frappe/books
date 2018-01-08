const frappe = require('frappe-core');
const path = require('path');

class RESTClient {
	constructor({server, protocol='http', fetch}) {
		this.server = server;
		this.protocol = protocol;
		frappe.fetch = fetch;
		this.json_headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	}

	connect() {

	}

	async insert(doctype, doc) {
		doc.doctype = doctype;
		let url = this.protocol + '://' + path.join(this.server, `/api/resource/${frappe.slug(doctype)}`);
		let response = await frappe.fetch(url, {
			method: 'POST',
			headers: this.json_headers,
			body: JSON.stringify(doc)
		});

		return await response.json();
	}

	async get(doctype, name) {
		let url = this.protocol + '://' + path.join(this.server, `/api/resource/${frappe.slug(doctype)}/${name}`);
		let response = await frappe.fetch(url, {
			method: 'GET',
			headers: this.json_headers
		});
		return await response.json();
	}

	async get_all({doctype, fields, filters, start, limit, sort_by, order}) {
		let url = this.protocol + '://' + path.join(this.server, `/api/resource/${frappe.slug(doctype)}`);
		let response = await frappe.fetch(url, {
			method: 'GET',
			params: {
				fields: JSON.stringify(fields),
				filters: JSON.stringify(filters),
				start: start,
				limit: limit,
				sort_by: sort_by,
				order: order
			},
			headers: this.json_headers
		});
		return await response.json();

	}

	async update(doctype, doc) {
		doc.doctype = doctype;
		let url = this.protocol + '://' + path.join(this.server, `/api/resource/${frappe.slug(doctype)}/${doc.name}`);
		let response = await frappe.fetch(url, {
			method: 'PUT',
			headers: this.json_headers,
			body: JSON.stringify(doc)
		});

		return await response.json();
	}

	async delete(doctype, name) {
		let url = this.protocol + '://' + path.join(this.server, `/api/resource/${frappe.slug(doctype)}/${name}`);

		let response = await frappe.fetch(url, {
			method: 'DELETE',
			headers: this.json_headers
		});

		return await response.json();
	}

	close() {

	}

}

module.exports = {
	Database: RESTClient
}