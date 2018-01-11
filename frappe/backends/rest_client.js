const frappe = require('frappe-core');
const path = require('path');

class RESTClient {
	constructor({server, protocol='http'}) {
		this.server = server;
		this.protocol = protocol;

		this.init_type_map();

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

		url = url + "?" + this.get_query_string({
			fields: JSON.stringify(fields),
			filters: JSON.stringify(filters),
			start: start,
			limit: limit,
			sort_by: sort_by,
			order: order
		});

		let response = await frappe.fetch(url, {
			method: 'GET',
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

	get_query_string(params) {
		return Object.keys(params)
			.map(k => params[k] != null ? encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) : null)
			.filter(v => v)
			.join('&');
	}

	init_type_map() {
		this.type_map = {
			'Currency':		true
			,'Int':			true
			,'Float':		true
			,'Percent':		true
			,'Check':		true
			,'Small Text':	true
			,'Long Text':	true
			,'Code':		true
			,'Text Editor':	true
			,'Date':		true
			,'Datetime':	true
			,'Time':		true
			,'Text':		true
			,'Data':		true
			,'Link':		true
			,'Dynamic Link':true
			,'Password':	true
			,'Select':		true
			,'Read Only':	true
			,'Attach':		true
			,'Attach Image':true
			,'Signature':	true
			,'Color':		true
			,'Barcode':		true
			,'Geolocation':	true
		}
	}

	close() {

	}

}

module.exports = {
	Database: RESTClient
}