const frappe = require('frappejs');

module.exports = class BaseDocument {
    constructor(data) {
        this.handlers = {};
        this.setup();
        Object.assign(this, data);
    }

    setup() {
        // add handlers
    }

    clear_handlers() {
        this.handlers = {};
    }

    add_handler(key, method) {
        if (!this.handlers[key]) {
            this.handlers[key] = [];
        }
        this.handlers[key].push(method || key);
    }

    get(fieldname) {
        return this[fieldname];
    }

    // set value and trigger change
    async set(fieldname, value) {
        this[fieldname] = await this.validate_field(fieldname, value);
        await this.trigger('change', {doc: this, fieldname: fieldname, value: value});
    }

    set_name() {
        // assign a random name by default
        // override this to set a name
        if (!this.name) {
            this.name = Math.random().toString(36).substr(3);
        }
    }

    set_keywords() {
        let keywords = [];
        for (let fieldname of this.meta.get_keyword_fields()) {
            keywords.push(this[fieldname]);
        }
        this.keywords = keywords.join(', ');
    }

    get meta() {
        if (!this._meta) {
            this._meta = frappe.get_meta(this.doctype);
        }
        return this._meta;
    }

    append(key, document) {
        if (!this[key]) {
            this[key] = [];
        }
        this[key].push(this.init_doc(document));
    }

    init_doc(data) {
        if (data.prototype instanceof Document) {
            return data;
        } else {
            return new Document(d);
        }
    }

    async validate_field (key, value) {
        let df = this.meta.get_field(key);
        if (df && df.fieldtype=='Select') {
            return this.meta.validate_select(df, value);
        }
        return value;
    }

    get_valid_dict() {
        let doc = {};
        for(let df of this.meta.get_valid_fields()) {
            doc[df.fieldname] = this.get(df.fieldname);
        }
        return doc;
    }

    set_standard_values() {
        let now = new Date();
        if (this.docstatus === null || this.docstatus === undefined) {
            this.docstatus = 0;
        }
        if (!this.owner) {
            this.owner = frappe.session.user;
            this.creation = now;
        }
        this.modified_by = frappe.session.user;
        this.modified = now;
    }

    async load() {
        let data = await frappe.db.get(this.doctype, this.name);
        if (data.name) {
            Object.assign(this, data);
        } else {
            throw new frappe.errors.NotFound(`Not Found: ${this.doctype} ${this.name}`);
        }
    }

    async insert() {
        this.set_name();
        this.set_standard_values();
        this.set_keywords();
        await this.trigger('validate');
        await this.trigger('before_insert');
        await frappe.db.insert(this.doctype, this.get_valid_dict());
        await this.trigger('after_insert');
        await this.trigger('after_save');
    }

    async delete() {
        await this.trigger('before_delete');
        await frappe.db.delete(this.doctype, this.name);
        await this.trigger('after_delete');
    }

    async trigger(key, params) {
        if (this.handlers[key]) {
            for (let method of this.handlers[key]) {
                if (typeof method === 'string') {
                    await this[method](params);
                } else {
                    await method(params);
                }
            }
        }
    }

    async update() {
        this.set_standard_values();
        this.set_keywords();
        await this.trigger('validate');
        await this.trigger('before_update');
        await frappe.db.update(this.doctype, this.get_valid_dict());
        await this.trigger('after_update');
        await this.trigger('after_save');
        return this;
    }
};