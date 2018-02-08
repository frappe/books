const BaseDocument = require('./document');
const frappe = require('frappejs');

module.exports = class BaseMeta extends BaseDocument {
    constructor(data) {
        super(data);
        this.event_handlers = {};
        this.list_options = {
            fields: ['name', 'modified']
        };
        if (this.setup_meta) {
            this.setup_meta();
        }
    }

    getField(fieldname) {
        if (!this._field_map) {
            this._field_map = {};
            for (let field of this.fields) {
                this._field_map[field.fieldname] = field;
            }
        }
        return this._field_map[fieldname];
    }

    getTableFields() {
        if (this._tableFields===undefined) {
            this._tableFields = this.fields.filter(field => field.fieldtype === 'Table');
        }
        return this._tableFields;
    }

    getFormulaFields() {
        if (this._formulaFields===undefined) {
            this._formulaFields = this.fields.filter(field => field.formula);
        }
        return this._formulaFields;
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

    getValidFields({ with_children = true } = {}) {
        if (!this._valid_fields) {

            this._valid_fields = [];
            this._valid_fields_with_children = [];

            const _add = (field) => {
                this._valid_fields.push(field);
                this._valid_fields_with_children.push(field);
            }

            const doctype_fields = this.fields.map((field) => field.fieldname);

            // standard fields
            for (let field of frappe.model.common_fields) {
                if (frappe.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                    _add(field);
                }
            }

            if (this.is_child) {
                // child fields
                for (let field of frappe.model.child_fields) {
                    if (frappe.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                        _add(field);
                    }
                }
            } else {
                // parent fields
                for (let field of frappe.model.parent_fields) {
                    if (frappe.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                        _add(field);
                    }
                }
            }

            // doctype fields
            for (let field of this.fields) {
                let include = frappe.db.type_map[field.fieldtype];

                if (include) {
                    _add(field);
                }

                // include tables if (with_children = True)
                if (!include && field.fieldtype === 'Table') {
                    this._valid_fields_with_children.push(field);
                }
            }
        }

        if (with_children) {
            return this._valid_fields_with_children;
        } else {
            return this._valid_fields;
        }
    }

    getKeywordFields() {
        return this.keyword_fields || this.meta.fields.filter(field => field.reqd).map(field => field.fieldname);
    }

    validate_select(field, value) {
        let options = field.options;
        if (typeof options === 'string') {
            // values given as string
            options = field.options.split('\n');
        }
        if (!options.includes(value)) {
            throw new frappe.errors.ValueError(`${value} must be one of ${options.join(", ")}`);
        }
        return value;
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
}