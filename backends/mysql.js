const frappe = require('frappejs');
const mysql = require('mysql');
const debug = false;


class mysqlDatabse{
    constructor({ db_name, username, password, host }) {
        this.db_name = db_name;
        this.username = username;
        this.password = password;
        this.host = host;
        this.init_type_map();
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

    async migrate() {
        for (let doctype in frappe.modules) {
            // check if controller module
            if (frappe.modules[doctype].Meta) {
                if (await this.table_exists(doctype)) {
                    await this.alter_table(doctype);
                } else {
                    await this.create_table(doctype);
                }

            }
        }
        await this.commit();
    }

    async create_table(doctype) {
        let meta = frappe.get_meta(doctype);
        let columns = [];
        let values = [];

        for (let df of meta.get_valid_fields({ with_children: false })) {
            if (this.type_map[df.fieldtype]) {
                columns.push(this.get_column_definition(df));
            }
        }

        const query = `CREATE TABLE IF NOT EXISTS ${frappe.slug(doctype)} (
            ${columns.join(", ")})`;

        return await this.run(query, values);
    }

    close() {
        this.conn.close();
    }
    get_column_definition(df) {
        return `${df.fieldname} ${this.type_map[df.fieldtype]} ${df.reqd && !df.default ? "not null" : ""} ${df.default ? `default '${df.default}'` : ""}`
    }

    async alter_table(doctype) {
        // get columns
        let table_columns = (await this.sql(`SHOW COLUMNS FROM ${doctype}`)).map(d => d.Field);
        let meta = frappe.get_meta(doctype);
        let values = [];

        for (let df of meta.get_valid_fields({ with_children: false })) {
            if (!table_columns.includes(df.fieldname) && this.type_map[df.fieldtype]) {
                values = []
                if (df.default) {
                    values.push(df.default);
                }
                await this.run(`ALTER TABLE ${frappe.slug(doctype)} ADD COLUMN ${this.get_column_definition(df)}`, values);
            }
        }
    }

    async get(doctype, name, fields = '*') {
        // load parent
        let doc = await this.get_one(doctype, name, fields);

        // load children
        let table_fields = frappe.get_meta(doctype).get_table_fields();
        for (let field of table_fields) {
            doc[fieldname] = await this.get_all({ doctype: field.childtype, fields: ["*"], filters: { parent: doc.name } });
        }
        return doc;
    }

    get_one(doctype, name, fields = '*') {
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
        // insert parent
        await this.insert_one(doctype, doc);

        // insert children
        let table_fields = frappe.get_meta(doctype).get_table_fields();
        for (let field of table_fields) {
            let idx = 0;
            for (let child of (doc[field.fieldname] || [])) {
                this.prepare_child(doctype, doc.name, child, field, idx);
                await this.insert_one(field.childtype, child);
                idx++;
            }
        }

        return doc;
    }

    async insert_one(doctype, doc) {
        let fields = this.get_keys(doctype);
        let placeholders = fields.map(d => '?').join(', ');

        if (!doc.name) {
            doc.name = frappe.get_random_name();
        }

        return await this.run(`insert into ${frappe.slug(doctype)}
            (${fields.map(field => field.fieldname).join(", ")})
            values (${placeholders})`, this.get_formatted_values(fields, doc));
    }

    async update(doctype, doc) {
        // update parent
        await this.update_one(doctype, doc);

        // insert or update children
        let table_fields = frappe.get_meta(doctype).get_table_fields();
        for (let field of table_fields) {

            // first key is "parent" - for SQL params
            let added_children = [doc.name];
            for (let child of (doc[field.fieldname] || [])) {
                this.prepare_child(doctype, doc.name, child, field, added_children.length - 1);
                if (await this.exists(field.childtype, child.name)) {
                    await this.update_one(field.childtype, child);
                } else {
                    await this.insert_one(field.childtype, child);
                }
                added_children.push(child.name);
            }

            // delete other children
            // `delete from doctype where parent = ? and name not in (?, ?, ?)}`
            await this.run(`delete from ${frappe.slug(field.childtype)}
                where
                    parent = ? and
                    name not in (${added_children.map(d => '?').join(', ')})`, added_children);
        }
        return doc;
    }

    async update_one(doctype, doc) {
        let fields = this.get_keys(doctype);
        let assigns = fields.map(field => `${field.fieldname} = ?`);
        let values = this.get_formatted_values(fields, doc);

        // additional name for where clause
        values.push(doc.name);

        return await this.run(`update ${frappe.slug(doctype)}
                set ${assigns.join(", ")} where name=?`, values);
    }

    prepare_child(parenttype, parent, child, field, idx) {
        child.parent = parent;
        child.parenttype = parenttype;
        child.parentfield = field.fieldname;
        child.idx = idx;
    }

    get_keys(doctype) {
        return frappe.get_meta(doctype).get_valid_fields({ with_children: false });
    }

    get_formatted_values(fields, doc) {
        let values = fields.map(field => {
            let value = doc[field.fieldname];
            if (value instanceof Date) {
                return value.toISOString();
            } else {
                return value;
            }
        });
        return values;
    }

    async delete(doctype, name) {
        await this.run(`delete from ${frappe.slug(doctype)} where name=?`, name);

        // delete children
        let table_fields = frappe.get_meta(doctype).get_table_fields();
        for (let field of table_fields) {
            await this.run(`delete from ${frappe.slug(field.childtype)} where parent=?`, name)
        }
    }

    async exists(doctype, name) {
        return (await this.get_value(doctype, name)) ? true : false;
    }

    async get_value(doctype, filters, fieldname = 'name') {
        if (typeof filters === 'string') {
            filters = { name: filters };
        }

        let row = await this.get_all({
            doctype: doctype,
            fields: [fieldname],
            filters: filters,
            start: 0,
            limit: 1
        });
        return row.length ? row[0][fieldname] : null;
    }

    get_all({ doctype, fields, filters, start, limit, order_by = 'modified', order = 'desc' } = {}) {
        if (!fields) {
            fields = frappe.get_meta(doctype).get_keyword_fields();
        }
        return new Promise((resolve, reject) => {
            let conditions = this.get_filter_conditions(filters);

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

    get_filter_conditions(filters) {
        // {"status": "Open"} => `status = "Open"`
        // {"status": "Open", "name": ["like", "apple%"]}
        // => `status="Open" and name like "apple%"
        let conditions = [];
        let values = [];
        for (let key in filters) {
            const value = filters[key];
            if (value instanceof Array) {
                // if its like, we should add the wildcard "%" if the user has not added
                if (value[0].toLowerCase() === 'like' && !value[1].includes('%')) {
                    value[1] = `%${value[1]}%`;
                }
                conditions.push(`${key} ${value[0]} ?`);
                values.push(value[1]);
            } else {
                conditions.push(`${key} = ?`);
                values.push(value);
            }
        }
        return {
            conditions: conditions.length ? conditions.join(" and ") : "",
            values: values
        };
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

    async table_exists(table) {

        const name = await this.sql(`SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = '${this.db_name}'
            AND table_name = '${table}'`);
        return (name && name.length) ? true : false;
    }
    init_type_map() {
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
            , 'Date': 'DATE'
            , 'Datetime': 'DATETIME'
            , 'Time': 'TIME'
            , 'Text': 'text'
            , 'Data': 'VARCHAR(140)'
            , 'Link': ' varchar(140)'
            , 'Dynamic Link': 'text'
            , 'Password': 'varchar(140)'
            , 'Select': 'VARCHAR(140)'
            , 'Read Only': 'varchar(140)'
            , 'Attach': 'text'
            , 'Attach Image': 'text'
            , 'Signature': 'text'
            , 'Color': 'text'
            , 'Barcode': 'text'
            , 'Geolocation': 'text'
        }
    }
}


module.exports = { Database: mysqlDatabse };
