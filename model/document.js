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
        this[fieldname] = await this.validateField(fieldname, value);
        if (this.applyFormulae()) {
            // multiple changes
            await this.trigger('change', { doc: this });
        } else {
            // no other change, trigger control refresh
            await this.trigger('change', { doc: this, fieldname: fieldname, value: value });
        }
    }

    setName() {
        // assign a random name by default
        // override this to set a name
        if (!this.name) {
            this.name = frappe.getRandomName();
        }
    }

    setKeywords() {
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
        this[key].push(this.initDoc(document));
    }

    initDoc(data) {
        if (data.prototype instanceof Document) {
            return data;
        } else {
            return new Document(data);
        }
    }

    async validateField(key, value) {
        let field = this.meta.getField(key);
        if (field && field.fieldtype == 'Select') {
            return this.meta.validate_select(field, value);
        }
        return value;
    }

    getValidDict() {
        let data = {};
        for (let field of this.meta.getValidFields()) {
            data[field.fieldname] = this[field.fieldname];
        }
        return data;
    }

    setStandardValues() {
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
            this.syncValues(data);
        } else {
            throw new frappe.errors.NotFound(`Not Found: ${this.doctype} ${this.name}`);
        }
    }

    syncValues(data) {
        this.clearValues();
        Object.assign(this, data);
    }

    clearValues() {
        for (let field of this.meta.getValidFields()) {
            if(this[field.fieldname]) {
                delete this[field.fieldname];
            }
        }
    }

    setChildIdx() {
        // renumber children
        for (let field of this.meta.getValidFields()) {
            if (field.fieldtype==='Table') {
                for(let i=0; i < (this[field.fieldname] || []).length; i++) {
                    this[field.fieldname][i].idx = i;
                }
            }
        }
    }

    applyFormulae() {
        if (!this.hasFormulae()) {
            return false;
        }

        let doc;

        // children
        for (let tablefield of this.meta.getTableFields()) {
            let formulaFields = frappe.getMeta(tablefield.childtype).getFormulaFields();
            if (formulaFields.length) {

                // for each row
                for (doc of this[tablefield.fieldname]) {
                    for (let field of formulaFields) {
                        doc[field.fieldname] = eval(field.formula);
                    }
                }
            }
        }

        // parent
        doc = this;
        for (let field of this.meta.getFormulaFields()) {
            doc[field.fieldname] = eval(field.formula);
        }

        return true;
    }

    hasFormulae() {
        if (this._hasFormulae===undefined) {
            this._hasFormulae = false;
            if (this.meta.getFormulaFields().length) {
                this._hasFormulae = true;
            } else {
                for (let tablefield of this.meta.getTableFields()) {
                    if (frappe.getMeta(tablefield.childtype).getFormulaFields().length) {
                        this._hasFormulae = true;
                        break;
                    }
                }
            }
        }
        return this._hasFormulae;
    }

    async commit() {
        // re-run triggers
        this.setName();
        this.setStandardValues();
        this.setKeywords();
        this.setChildIdx();
        this.applyFormulae();
        await this.trigger('validate');
        await this.trigger('commit');
    }

    async insert() {
        await this.commit();
        await this.trigger('before_insert');
        this.syncValues(await frappe.db.insert(this.doctype, this.getValidDict()));
        await this.trigger('after_insert');
        await this.trigger('after_save');

        return this;
    }

    async update() {
        await this.commit();
        await this.trigger('before_update');
        this.syncValues(await frappe.db.update(this.doctype, this.getValidDict()));
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