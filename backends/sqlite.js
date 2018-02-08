const frappe = require('frappejs');
const sqlite3 = require('sqlite3').verbose();
const Database = require('./database');
const debug = false;

module.exports = class sqliteDatabase extends Database {
    constructor({ dbPath }) {
        super();
        this.dbPath = dbPath;
    }

    connect(dbPath) {
        if (dbPath) {
            this.dbPath = dbPath;
        }
        return new Promise(resolve => {
            this.conn = new sqlite3.Database(this.dbPath, () => {
                if (debug) {
                    this.conn.on('trace', (trace) => console.log(trace));
                }
                resolve();
            });
        });
    }

    async tableExists(table) {
        const name = await this.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
        return (name && name.length) ? true : false;
    }

    async runCreateTableQuery(doctype, columns, values) {
        const query = `CREATE TABLE IF NOT EXISTS ${frappe.slug(doctype)} (
            ${columns.join(", ")})`;

        return await this.run(query, values);
    }

    getColumnDefinition(df) {
        return `${df.fieldname} ${this.type_map[df.fieldtype]} ${df.reqd && !df.default ? "not null" : ""} ${df.default ? `default ${df.default}` : ""}`
    }

    async getTableColumns(doctype) {
        return (await this.sql(`PRAGMA table_info(${doctype})`)).map(d => d.name);
    }

    async runAlterTableQuery(doctype, field, values) {
        await this.run(`ALTER TABLE ${frappe.slug(doctype)} ADD COLUMN ${this.getColumnDefinition(field)}`, values);
    }

    getOne(doctype, name, fields = '*') {
        fields = this.prepareFields(fields);
        return new Promise((resolve, reject) => {
            this.conn.get(`select ${fields} from ${frappe.slug(doctype)}
                where name = ?`, name,
                (err, row) => {
                    resolve(row || {});
                });
        });
    }

    async insertOne(doctype, doc) {
        let fields = this.getKeys(doctype);
        let placeholders = fields.map(d => '?').join(', ');

        if (!doc.name) {
            doc.name = frappe.getRandomName();
        }

        return await this.run(`insert into ${frappe.slug(doctype)}
            (${fields.map(field => field.fieldname).join(", ")})
            values (${placeholders})`, this.getFormattedValues(fields, doc));
    }

    async updateOne(doctype, doc) {
        let fields = this.getKeys(doctype);
        let assigns = fields.map(field => `${field.fieldname} = ?`);
        let values = this.getFormattedValues(fields, doc);

        // additional name for where clause
        values.push(doc.name);

        return await this.run(`update ${frappe.slug(doctype)}
                set ${assigns.join(", ")} where name=?`, values);
    }

    async runDeleteOtherChildren(field, added) {
        // delete other children
        // `delete from doctype where parent = ? and name not in (?, ?, ?)}`
        await this.run(`delete from ${frappe.slug(field.childtype)}
            where
                parent = ? and
                name not in (${added.slice(1).map(d => '?').join(', ')})`, added);
    }

    async deleteOne(doctype, name) {
        return await this.run(`delete from ${frappe.slug(doctype)} where name=?`, name);
    }

    async deleteChildren(parenttype, parent) {
        await this.run(`delete from ${parent} where parent=?`, parent);
    }

    getAll({ doctype, fields, filters, start, limit, order_by = 'modified', order = 'desc' } = {}) {
        if (!fields) {
            fields = frappe.getMeta(doctype).getKeywordFields();
        }
        return new Promise((resolve, reject) => {
            let conditions = this.getFilterConditions(filters);

            this.conn.all(`select ${fields.join(", ")}
                from ${frappe.slug(doctype)}
                ${conditions.conditions ? "where" : ""} ${conditions.conditions}
                ${order_by ? ("order by " + order_by) : ""} ${order_by ? (order || "asc") : ""}
                ${limit ? ("limit " + limit) : ""} ${start ? ("offset " + start) : ""}`, conditions.values,
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
        });
    }

    run(query, params) {
        return new Promise((resolve, reject) => {
            this.conn.run(query, params, (err) => {
                if (err) {
                    if (debug) {
                        console.log(err);
                    }
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    sql(query, params) {
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

    initTypeMap() {
        this.type_map = {
            'Currency': 'real'
            , 'Int': 'integer'
            , 'Float': 'real'
            , 'Percent': 'real'
            , 'Check': 'integer'
            , 'Small Text': 'text'
            , 'Long Text': 'text'
            , 'Code': 'text'
            , 'Text Editor': 'text'
            , 'Date': 'text'
            , 'Datetime': 'text'
            , 'Time': 'text'
            , 'Text': 'text'
            , 'Data': 'text'
            , 'Link': 'text'
            , 'Dynamic Link': 'text'
            , 'Password': 'text'
            , 'Select': 'text'
            , 'Read Only': 'text'
            , 'Attach': 'text'
            , 'Attach Image': 'text'
            , 'Signature': 'text'
            , 'Color': 'text'
            , 'Barcode': 'text'
            , 'Geolocation': 'text'
        }
    }
}
