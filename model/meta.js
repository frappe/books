const Document = require('./document').Document;
const frappe = require('frappejs');

class Meta extends Document {
    constructor(data) {
        super(data);
        this.event_handlers = {};
        this.list_options = {
            fields: ['name', 'modified']
        };
        if (this.setup_meta)  {
            this.setup_meta();
        }
    }

    get_field(fieldname) {
        if (!this.field_map) {
            this.field_map = {};
            for (let df of this.fields) {
                this.field_map[df.fieldname] = df;
            }
        }
        return this.field_map[fieldname];
    }

    on(key, fn) {
        if (!this.event_handlers[key]) {
            this.event_handlers[key] = [];
        }
        this.event_handlers[key].push(fn);
    }

    async set(fieldname, value) {
        this[fieldname] = value;
        await this.trigger(fieldname);
    }

    get(fieldname) {
        return this[fieldname];
    }

    get_valid_fields() {
        if (!this._valid_fields) {
            this._valid_fields = [];

            const doctype_fields = this.fields.map((df) => df.fieldname);

            // standard fields
            for (let df of frappe.model.standard_fields) {
                if (frappe.db.type_map[df.fieldtype] && !doctype_fields.includes(df.fieldname)) {
                    this._valid_fields.push(df);
                }
            }

            // parent fields
            if (this.istable) {
                for (let df of frappe.model.child_fields) {
                    if (frappe.db.type_map[df.fieldtype] && !doctype_fields.includes(df.fieldname)) {
                        this._valid_fields.push(df);
                    }
                }
            }

            // doctype fields
            for (let df of this.fields) {
                if (frappe.db.type_map[df.fieldtype]) {
                    this._valid_fields.push(df);
                }
            }
        }

        return this._valid_fields;
    }

    get_keyword_fields() {
        return this.keyword_fields || this.meta.fields.filter(df => df.reqd).map(df => df.fieldname);
    }

    validate_select(df, value) {
        let options = df.options;
        if (typeof options === 'string') {
            // values given as string
            options = df.options.split('\n');
        }
        if (!options.includes(value)) {
            throw new frappe.errors.ValueError(`${value} must be one of ${options.join(", ")}`);
        }
    }

    async trigger(key, event = {}) {

        Object.assign(event, {
            doc: this,
            name: key
        });

        if (this.event_handlers[key]) {
            for (var handler of this.event_handlers[key]) {
                await handler(event);
            }
        }
    }

    // collections
    async get_list({start, limit=20, filters}) {
        return await frappe.db.get_all({
            doctype: this.name,
            fields: this.list_options.fields,
            filters: filters,
            start: start,
            limit: limit
        });
    }

    get_row_html(data) {
        return `<a href="/view/${this.name}/${data.name}">${data.name}</a>`;
    }

}

module.exports = { Meta: Meta }