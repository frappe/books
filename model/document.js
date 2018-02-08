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

    clearHandlers() {
        this.handlers = {};
    }

    addHandler(key, method) {
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
        await this.trigger('change', { doc: this, fieldname: fieldname, value: value });
    }

    set_name() {
        // assign a random name by default
        // override this to set a name
        if (!this.name) {
            this.name = frappe.getRandomName();
        }
    }

    set_keywords() {
        let keywords = [];
        for (let fieldname of this.meta.getKeywordFields()) {
            keywords.push(this[fieldname]);
        }
        this.keywords = keywords.join(', ');
    }

    get meta() {
        if (!this._meta) {
            this._meta = frappe.getMeta(this.doctype);
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
            return new Document(data);
        }
    }

    async validate_field(key, value) {
        let field = this.meta.get_field(key);
        if (field && field.fieldtype == 'Select') {
            return this.meta.validate_select(field, value);
        }
        return value;
    }

    get_valid_dict() {
        let data = {};
        for (let field of this.meta.getValidFields()) {
            data[field.fieldname] = this[field.fieldname];
        }
        return data;
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
            this.sync_values(data);
        } else {
            throw new frappe.errors.NotFound(`Not Found: ${this.doctype} ${this.name}`);
        }
    }

    sync_values(data) {
        this.clear_values();
        Object.assign(this, data);
    }

    clear_values() {
        for (let field of this.meta.getValidFields()) {
            if(this[field.fieldname]) {
                delete this[field.fieldname];
            }
        }
    }

    set_child_idx() {
        // renumber children
        for (let field of this.meta.getValidFields()) {
            if (field.fieldtype==='Table') {
                for(let i=0; i < (this[field.fieldname] || []).length; i++) {
                    this[field.fieldname][i].idx = i;
                }
            }
        }
    }

    async commit() {
        // re-run triggers
        this.set_name();
        this.set_standard_values();
        this.set_keywords();
        this.set_child_idx();
        await this.trigger('validate');
        await this.trigger('commit');
    }

    async insert() {
        await this.commit();
        await this.trigger('before_insert');
        this.sync_values(await frappe.db.insert(this.doctype, this.get_valid_dict()));
        await this.trigger('after_insert');
        await this.trigger('after_save');

        return this;
    }

    async update() {
        await this.commit();
        await this.trigger('before_update');
        this.sync_values(await frappe.db.update(this.doctype, this.get_valid_dict()));
        await this.trigger('after_update');
        await this.trigger('after_save');

        return this;
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
};