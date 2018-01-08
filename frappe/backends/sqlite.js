const frappe = require('frappe-core');
const sqlite3 = require('sqlite3').verbose();

class sqliteDatabase {
	constructor({db_path}) {
		this.db_path = db_path;
		this.init_type_map();
	}

	connect(db_path) {
		if (db_path) {
			this.db_path = db_path;
		}
		return new Promise(resolve => {
			this.conn = new sqlite3.Database(this.db_path, () => {
				resolve();
			});
		});
	}

	async migrate() {
		for (let doctype in frappe.models.data.doctype) {
			if (await this.table_exists(doctype)) {
				await this.alter_table(doctype);
			} else {
				await this.create_table(doctype);
			}
		}
		await this.commit();
	}

	async create_table(doctype) {
		let meta = frappe.get_meta(doctype);
		let columns = [];

		for (let df of this.get_fields(meta)) {
			if (this.type_map[df.fieldtype]) {
				columns.push(`${df.fieldname} ${this.type_map[df.fieldtype]} ${df.reqd ? "not null" : ""} ${df.default ? ("default " + frappe.sqlescape(df.default)) : ""}`);
			}
		}

		const query = `CREATE TABLE IF NOT EXISTS ${frappe.slug(doctype)} (
			${columns.join(", ")})`;

		return await this.run(query);
	}

	close() {
		this.conn.close();
	}

	async alter_table(doctype) {
		// add columns

		// change columns

	}

	get(doctype, name, fields='*') {
		if (fields instanceof Array) {
			fields = fields.join(", ");
		}
		return new Promise((resolve, reject) => {
			this.conn.get(`select ${fields} from ${frappe.slug(doctype)}
				where name = ?`, name,
				(err, row) => {
					resolve(row || {});
				});
		});
	}

	async insert(doctype, doc) {
		return await this.run(`insert into ${frappe.slug(doctype)}
			(${Object.keys(doc).join(", ")})
			values (${Object.values(doc).map(d => frappe.db.escape(d)).join(", ")})`);
	}

	async update(doctype, doc) {
		let assigns = [];
		for (let key in doc) {
			assigns.push(`${key} = ${this.escape(doc[key])}`);
		}
		return await this.run(`update ${frappe.slug(doctype)}
				set ${assigns.join(", ")}`);
	}

	async delete(doctype, name) {
		return await this.run(`delete from ${frappe.slug(doctype)} where name=?`, name);
	}

	get_all({doctype, fields=['name'], filters, start, limit, order_by='modified', order='desc'} = {}) {
		return new Promise(resolve => {
			this.conn.all(`select ${fields.join(", ")}
				from ${frappe.slug(doctype)}
				${filters ? "where" : ""} ${this.get_filter_conditions(filters)}
				${order_by ? ("order by " + order_by) : ""} ${order_by ? (order || "asc") : ""}
				${limit ? ("limit " + limit) : ""} ${start ? ("offset " + start) : ""}`,
				(err, rows) => {
					resolve(rows);
				});
		});
	}

	get_filter_conditions(filters) {
		// {"status": "Open"} => `status = "Open"`
		// {"status": "Open", "name": ["like", "apple%"]}
			// => `status="Open" and name like "apple%"
		let conditions = [];
		for (let key in filters) {
			const value = filters[key];
			if (value instanceof Array) {
				conditions.push(`${key} ${value[0]} ${this.escape(value)}`);
			} else {
				conditions.push(`${key} = ${this.escape(value)}`);
			}
		}
		return conditions.join(" and ");
	}

	run(query, params) {
		//console.log(query);
		return new Promise((resolve, reject) => {
			this.conn.run(query, params, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	sql(query, params) {
		//console.log(query);
		return new Promise((resolve) => {
			this.conn.all(query, params, (err, rows) => {
				resolve(rows);
			});
		});
	}

	async commit() {
		try {
			await this.run('commit');
		} catch (e) {
			if (e.errno !== 1) {
				throw e;
			}
		}
	}

	async get_value(doctype, filters, fieldname='name') {
		if (typeof filters==='string') {
			filters = {name: filters};
		}

		let row = await this.get_all({
			doctype:doctype,
			fields: [fieldname],
			filters: filters,
			start: 0,
			limit: 1});
		return row.length ? row[0][fieldname] : null;
	}

	escape(value) {
		return frappe.sqlescape(value);
	}

	get_fields(meta) {
		// add standard fields
		let fields = frappe.model.standard_fields.slice();
		if (meta.istable) {
			fields = fields.concat(frappe.model.child_fields);
		}

		// add model fields
		fields = fields.concat(meta.fields);

		return fields;
	}

	async table_exists(table) {
		const name = await this.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
		return (name && name.length) ? true : false;
	}

	init_type_map() {
		this.type_map = {
			'Currency':		'real'
			,'Int':			'integer'
			,'Float':		'real'
			,'Percent':		'real'
			,'Check':		'integer'
			,'Small Text':	'text'
			,'Long Text':	'text'
			,'Code':		'text'
			,'Text Editor':	'text'
			,'Date':		'text'
			,'Datetime':	'text'
			,'Time':		'text'
			,'Text':		'text'
			,'Data':		'text'
			,'Link':		'text'
			,'Dynamic Link':'text'
			,'Password':	'text'
			,'Select':		'text'
			,'Read Only':	'text'
			,'Attach':		'text'
			,'Attach Image':'text'
			,'Signature':	'text'
			,'Color':		'text'
			,'Barcode':		'text'
			,'Geolocation':	'text'
		}
	}

}

module.exports = { Database: sqliteDatabase };
