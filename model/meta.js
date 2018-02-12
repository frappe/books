const BaseDocument = require('./document');
const frappe = require('frappejs');

module.exports = class BaseMeta extends BaseDocument {
    constructor(data) {
        super(data);
        this.event_handlers = {};
        this.list_options = {
            fields: ['name', 'modified']
        };
        if (this.setupMeta) {
            this.setupMeta();
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

    hasFormulae() {
        if (this._hasFormulae===undefined) {
            this._hasFormulae = false;
            if (this.getFormulaFields().length) {
                this._hasFormulae = true;
            } else {
                for (let tablefield of this.getTableFields()) {
                    if (frappe.getMeta(tablefield.childtype).getFormulaFields().length) {
                        this._hasFormulae = true;
                        break;
                    }
                }
            }
        }
        return this._hasFormulae;
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

    getValidFields({ withChildren = true } = {}) {
        if (!this._valid_fields) {

            this._valid_fields = [];
            this._valid_fields_withChildren = [];

            const _add = (field) => {
                this._valid_fields.push(field);
                this._valid_fields_withChildren.push(field);
            }

            const doctype_fields = this.fields.map((field) => field.fieldname);

            // standard fields
            for (let field of frappe.model.common_fields) {
                if (frappe.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                    _add(field);
                }
            }

            if (this.isChild) {
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

                // include tables if (withChildren = True)
                if (!include && field.fieldtype === 'Table') {
                    this._valid_fields_withChildren.push(field);
                }
            }
        }

        if (withChildren) {
            return this._valid_fields_withChildren;
        } else {
            return this._valid_fields;
        }
    }

    getKeywordFields() {
        if (!this._keywordFields) {
            this._keywordFields = this.keywordFields;
            if (!(this._keywordFields && this._keywordFields.length && this.fields)) {
                this._keywordFields = this.fields.filter(field => field.required).map(field => field.fieldname);
            }
            if (!(this._keywordFields && this._keywordFields.length)) {
                this._keywordFields = ['name']
            }
        }
        return this._keywordFields;
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