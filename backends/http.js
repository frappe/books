const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');

module.exports = class HTTPClient extends Observable {
    constructor({ server, protocol = 'http' }) {
        super();

        this.server = server;
        this.protocol = protocol;

        // if the backend is http, then always client!
        frappe.isServer = false;

        this.initTypeMap();
    }

    connect() {

    }

    async insert(doctype, doc) {
        doc.doctype = doctype;
        let url = this.getURL('/api/resource', doctype);
        return await this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(doc)
        })
    }

    async get(doctype, name) {
        let url = this.getURL('/api/resource', doctype, name);
        return await this.fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        })
    }

    async getAll({ doctype, fields, filters, start, limit, sort_by, order }) {
        let url = this.getURL('/api/resource', doctype);

        url = url + "?" + frappe.getQueryString({
            fields: JSON.stringify(fields),
            filters: JSON.stringify(filters),
            start: start,
            limit: limit,
            sort_by: sort_by,
            order: order
        });

        return await this.fetch(url, {
            method: 'GET',
        });
    }

    async update(doctype, doc) {
        doc.doctype = doctype;
        let url = this.getURL('/api/resource', doctype, doc.name);

        return await this.fetch(url, {
            method: 'PUT',
            body: JSON.stringify(doc)
        });
    }

    async delete(doctype, name) {
        let url = this.getURL('/api/resource', doctype, name);

        return await this.fetch(url, {
            method: 'DELETE',
        });
    }

    async deleteMany(doctype, names) {
        let url = this.getURL('/api/resource', doctype);

        return await this.fetch(url, {
            method: 'DELETE',
            body: JSON.stringify(names)
        });
    }

    async exists(doctype, name) {
        return (await this.getValue(doctype, name, 'name')) ? true : false;
    }

    async getValue(doctype, name, fieldname) {
        let url = this.getURL('/api/resource', doctype, name, fieldname);

        return (await this.fetch(url, {
            method: 'GET',
        })).value;
    }

    async fetch(url, args) {
        args.headers = this.getHeaders();
        let response = await frappe.fetch(url, args);
        let data = await response.json();

        if (response.status !== 200) {
            throw Error(data.error);
        }

        return data;
    }

    getURL(...parts) {
        return this.protocol + '://' + this.server + parts.join('/');
    }

    getHeaders() {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }

    initTypeMap() {
        this.typeMap = {
            'Currency': true
            , 'Int': true
            , 'Float': true
            , 'Percent': true
            , 'Check': true
            , 'Small Text': true
            , 'Long Text': true
            , 'Code': true
            , 'Text Editor': true
            , 'Date': true
            , 'Datetime': true
            , 'Time': true
            , 'Text': true
            , 'Data': true
            , 'Link': true
            , 'Dynamic Link': true
            , 'Password': true
            , 'Select': true
            , 'Read Only': true
            , 'File': true
            , 'Attach': true
            , 'Attach Image': true
            , 'Signature': true
            , 'Color': true
            , 'Barcode': true
            , 'Geolocation': true
        }
    }

    close() {

    }

}