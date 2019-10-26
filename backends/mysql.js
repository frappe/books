const frappe = require('frappejs');
const mysql = require('mysql');
const Database = require('./database');
const debug = false;


module.exports = class mysqlDatabase extends Database{
    constructor({ db_name, username, password, host }) {
        super();
        this.db_name = db_name;
        this.username = username;
        this.password = password;
        this.host = host;
        this.init_typeMap();
    }

    connect(db_name) {
        if (db_name) {
            this.db_name = db_name;
        }
        return new Promise(resolve => {
            this.conn = new mysql.createConnection({
                      host     : this.host,
                      user     : this.username,
                      password : this.password,
                      database : this.db_name
                    });
            () => {
                if (debug) {
                    this.conn.on('trace', (trace) => console.log(trace));
                }
            };
            resolve();
        });

    }

    async tableExists(table) {

        const name = await this.sql(`SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = '${this.db_name}'
            AND table_name = '${table}'`);
        return (name && name.length) ? true : false;
    }

    async runCreateTableQuery(doctype, columns, values){
        const query = `CREATE TABLE IF NOT EXISTS ${doctype} (
            ${columns.join(", ")})`;

        return await this.run(query, values);
    }


    updateColumnDefinition(df, columns, indexes) {
        columns.push(`${df.fieldname} ${this.typeMap[df.fieldtype]} ${df.required && !df.default ? "not null" : ""} ${df.default ? `default '${df.default}'` : ""}`);
    }

    async getTableColumns(doctype) {
        return (await this.sql(`SHOW COLUMNS FROM ${doctype}`)).map(d => d.Field);
    }


    async runAddColumnQuery(doctype, fields) {
        await this.run(`ALTER TABLE ${doctype} ADD COLUMN ${this.get_column_definition(doctype)}`);
    }

    getOne(doctype, name, fields = '*') {

        fields = this.prepareFields(fields);

        return new Promise((resolve, reject) => {
            this.conn.get(`select ${fields} from ${doctype}
                where name = ?`, name,
                (err, row) => {
                    resolve(row || {});
                });
        });
    }

    async insertOne(doctype, doc) {
        let fields = this.get_keys(doctype);
        let placeholders = fields.map(d => '?').join(', ');

        if (!doc.name) {
            doc.name = frappe.getRandomString();
        }

        return await this.run(`insert into ${doctype}
            (${fields.map(field => field.fieldname).join(", ")})
            values (${placeholders})`, this.getFormattedValues(fields, doc));
    }

    async updateOne(doctype, doc) {
        let fields = this.getKeys(doctype);
        let assigns = fields.map(field => `${field.fieldname} = ?`);
        let values = this.getFormattedValues(fields, doc);

        // additional name for where clause
        values.push(doc.name);

        return await this.run(`update ${doctype}
                set ${assigns.join(", ")} where name=?`, values);
    }

    async runDeleteOtherChildren(field, added) {
        await this.run(`delete from ${field.childtype}
            where
                parent = ? and
                name not in (${added.slice(1).map(d => '?').join(', ')})`, added);
    }

    async deleteOne(doctype, name) {
        return await this.run(`delete from ${doctype} where name=?`, name);
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
                from ${doctype}
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
        // TODO promisify
        return new Promise((resolve, reject) => {
            this.conn.query(query, params, (err) => {
                if (err) {
                    if (debug) {
                        console.error(err);
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
            this.conn.query(query, params, (err, rows) => {
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


    init_typeMap() {
        this.typeMap = {
            'AutoComplete': 'VARCHAR(140)'
            , 'Currency': 'real'
            , 'Int': 'INT'
            , 'Float': 'decimal(18,6)'
            , 'Percent': 'real'
            , 'Check': 'INT(1)'
            , 'Small Text': 'text'
            , 'Long Text': 'text'
            , 'Code': 'text'
            , 'Text Editor': 'text'
            , 'Date': 'DATE'
            , 'Datetime': 'DATETIME'
            , 'Time': 'TIME'
            , 'Text': 'text'
            , 'Data': 'VARCHAR(140)'
            , 'Link': ' varchar(140)'
            , 'DynamicLink': 'text'
            , 'Password': 'varchar(140)'
            , 'Select': 'VARCHAR(140)'
            , 'Read Only': 'varchar(140)'
            , 'File': 'text'
            , 'Attach': 'text'
            , 'Attach Image': 'text'
            , 'Signature': 'text'
            , 'Color': 'text'
            , 'Barcode': 'text'
            , 'Geolocation': 'text'
        }
    }
}
