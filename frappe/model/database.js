const fs = require('fs');
const path = require('path');
const SQL = require('sql.js');
const frappe = require('frappe-core');

class Database {
	constructor(db_path) {
		this.db_file_name = db_path;
		this.connect();
	}

	connect() {
		if (this.db_path) {
			const filebuffer = fs.readFileSync(this.db_path);
			this._conn = new SQL.Database(filebuffer);
		} else {
			this._conn = new SQL.Database();
		}
	}

	write() {
		if (this.db_path) {
			let data = this._conn.export();
			fs.writeFileSync(this.db_path, new Buffer(data));
		}
	}

	close() {
		this.write();
		this._conn.close();
	}

	create_db() {
		// Create a database.
		let db = new SQL.Database();
		let query = SCHEMA;
		let result = db.exec(query);
		if (Object.keys(result).length === 0 &&
			typeof result.constructor === 'function') {
			return db;
		} else {
			return null;
		}
	}

	migrate() {
		for (let doctype in frappe.models.path_map.doctype) {
			if (this.table_exists(doctype)) {
				this.alter_table(doctype);
			} else {
				this.create_table(doctype);
			}
		}
	}

	create_table(doctype) {
		let meta = frappe.get_meta(doctype);
		let columns = [];

		for (let df of this.get_fields(meta)) {
			if (frappe.model.type_map[df.fieldtype]) {
				columns.push(`${df.fieldname} ${frappe.model.type_map[df.fieldtype]} ${df.reqd ? "not null" : ""} ${df.default ? ("default " + frappe.utils.sqlescape(df.default)) : ""}`);
			}
		}

		const query = `CREATE TABLE IF NOT EXISTS ${frappe.slug(doctype)} (
			${columns.join(", ")})`;

		return this.sql(query);
	}

	alter_table(doctype) {
		// add columns

		// change columns

	}

	get(doctype, name) {
		let doc = frappe.db.sql(`select * from ${frappe.slug(doctype)} where name = ${frappe.db.escape(name)}`);
		return doc ? doc[0] : {};
	}

	insert(doctype, doc) {
		this.sql(`insert into ${frappe.slug(doctype)}
			(${Object.keys(doc).join(", ")})
			values (${Object.values(doc).map(d => frappe.db.escape(d)).join(", ")})`);
	}

	update(doctype, doc) {
		let assigns = [];
		for (let key in doc) {
			assigns.push(`${key} = ${this.escape(doc[key])}`);
		}
		this.sql(`update ${frappe.slug(doctype)}
			set ${assigns.join(", ")}`);
	}

	get_all(doctype, fields=['name'], filters, start, limit) {
		return this.sql(`select ${fields.join(", ")}
			from ${frappe.slug(doctype)}
			${filters ? "where" : ""} ${this.get_filter_conditions(filters)}
			${limit ? ("limit " + limit) : ""} ${start ? ("offset " + start) : ""}`);
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

	sql(query, opts={}) {
		//console.log(query);
		const result = frappe.db._conn.exec(query);
		if (result.length > 0) {
			if (opts.as_list)
				return result[0];
			else
				return sql_result_to_obj(result[0]);
		}
		return null;
	}

	get_value(doctype, name, fieldname='name') {
		let value = this.sql(`select ${fieldname} from ${frappe.slug(doctype)}
			where name=${this.escape(name)}`);
		return value.length ? value[0][fieldname] : null;
	}

	escape(value) {
		return frappe.utils.sqlescape(value);
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

	table_exists(table) {
		return this.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`) ? true : false;
	}
}

function sql_result_to_obj(result) {
	const columns = result.columns;
	return result.values.map(row => {
		return columns.reduce((res, col, i) => {
			res[col] = row[i];
			return res;
		}, {});
	})
}

module.exports = { Database: Database };