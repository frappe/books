const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');
const model = require('./index');

module.exports = class BaseDocument extends Observable {
    constructor(data) {
        super();
        this.fetchValues = {};
        this.setup();
        Object.assign(this, data);
    }

    setup() {
        // add listeners
    }

    get meta() {
        if (!this._meta) {
            this._meta = frappe.getMeta(this.doctype);
        }
        return this._meta;
    }

    async getSettings() {
        if (!this._settings) {
            this._settings = await frappe.getSingle(this.meta.settings);
        }
        return this._settings;
    }

    get(fieldname) {
        return this[fieldname];
    }

    // set value and trigger change
    async set(fieldname, value) {
        if (this[fieldname] !== value) {
            this._dirty = true;
            this[fieldname] = await this.validateField(fieldname, value);
            await this.applyChange(fieldname);
        }
    }

    async applyChange(fieldname) {
        if (await this.applyFormula()) {
            // multiple changes
            await this.trigger('change', { doc: this });
        } else {
            // no other change, trigger control refresh
            await this.trigger('change', { doc: this, fieldname: fieldname });
        }
    }

    async setName() {
        if (this.name) {
            return;
        }

        // name === doctype for Single
        if (this.meta.isSingle) {
            this.name = this.meta.name;
            return;
        }

        if (this.meta.settings) {
            const numberSeries = (await this.getSettings()).numberSeries;
            if(numberSeries) {
                this.name = await model.getSeriesNext(numberSeries);
            }
        }

        // assign a random name by default
        // override this to set a name
        if (!this.name) {
            this.name = frappe.getRandomName();
        }
    }

    setDefaults() {
        for (let field of this.meta.fields) {
            if (this[field.fieldname]===null || this[field.fieldname]===undefined) {
                if (field.fieldtype === 'Date') {
                    this[field.fieldname] = (new Date()).toISOString().substr(0, 10);
                } else if(field.default) {
                    this[field.fieldname] = field.default;
                }
            }
        }
    }

    setKeywords() {
        let keywords = [];
        for (let fieldname of this.meta.getKeywordFields()) {
            keywords.push(this[fieldname]);
        }
        this.keywords = keywords.join(', ');
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
            return this.meta.validateSelect(field, value);
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
        // set standard values on server-side only
        if (frappe.isServer) {
            let now = new Date();
            if (!this.submitted) this.submitted = 0;
            if (!this.owner) {
                this.owner = frappe.session.user;
                this.creation = now;
            }
            this.modifieldBy = frappe.session.user;
            this.modified = now;
        }
    }

    async load() {
        let data = await frappe.db.get(this.doctype, this.name);
        if (data.name) {
            this.syncValues(data);
            if (this.meta.isSingle) {
                this.setDefaults();
            }
        } else {
            throw new frappe.errors.NotFound(`Not Found: ${this.doctype} ${this.name}`);
        }
    }

    syncValues(data) {
        this.clearValues();
        Object.assign(this, data);
        this._dirty = false;
        this.trigger('change', {doc: this});
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

    async compareWithCurrentDoc() {
        if (frappe.isServer && !this._notInserted) {
            let currentDoc = await frappe.db.get(this.doctype, this.name);

            // check for conflict
            if (currentDoc && this.modified != currentDoc.modified) {
                throw new frappe.errors.Conflict(frappe._('Document {0} {1} has been modified after loading', [this.doctype, this.name]));
            }

            if (this.submitted && !this.meta.isSubmittable) {
                throw new frappe.errors.ValidationError(frappe._('Document type {1} is not submittable', [this.doctype]));
            }

            // set submit action flag
            if (this.submitted && !currentDoc.submitted) {
                this.submitAction = true;
            }

            if (currentDoc.submitted && !this.submitted) {
                this.unSubmitAction = true;
            }
        }
    }

    async applyFormula() {
        if (!this.meta.hasFormula()) {
            return false;
        }

        let doc = this;

        // children
        for (let tablefield of this.meta.getTableFields()) {
            let formulaFields = frappe.getMeta(tablefield.childtype).getFormulaFields();
            if (formulaFields.length) {

                // for each row
                for (let row of this[tablefield.fieldname]) {
                    for (let field of formulaFields) {
                        row[field.fieldname] = await field.formula(row, doc);
                    }
                }
            }
        }

        // parent
        for (let field of this.meta.getFormulaFields()) {
            doc[field.fieldname] = await field.formula(doc);
        }

        return true;
    }

    async commit() {
        // re-run triggers
        await this.setName();
        this.setStandardValues();
        this.setKeywords();
        this.setChildIdx();
        await this.applyFormula();
        await this.trigger('validate');
    }

    async insert() {
        await this.commit();
        await this.trigger('beforeInsert');
        this.syncValues(await frappe.db.insert(this.doctype, this.getValidDict()));
        await this.trigger('afterInsert');
        await this.trigger('afterSave');

        return this;
    }

    async update() {
        await this.compareWithCurrentDoc();
        await this.commit();
        await this.trigger('beforeUpdate');
        if (this.submitAction) this.trigger('beforeSubmit');
        if (this.unSubmitAction) this.trigger('beforeUnSubmit');
        this.syncValues(await frappe.db.update(this.doctype, this.getValidDict()));
        await this.trigger('afterUpdate');
        await this.trigger('afterSave');
        if (this.submitAction) this.trigger('afterSubmit');
        if (this.unSubmitAction) this.trigger('afterUnSubmit');

        return this;
    }

    async delete() {
        await this.trigger('before_delete');
        await frappe.db.delete(this.doctype, this.name);
        await this.trigger('after_delete');
    }

    // trigger methods on the class if they match
    // with the trigger name
    async trigger(event, params) {
        if (this[event]) {
            await this[event](params);
        }
        await super.trigger(event, params);
    }

    // helper functions
    getSum(tablefield, childfield) {
        return this[tablefield].map(d => (d[childfield] || 0)).reduce((a, b) => a + b, 0);
    }

    async getFrom(doctype, name, fieldname) {
        if (!name) return '';
        let key = `${doctype}:${name}:${fieldname}`;
        if (!this.fetchValues[key]) {
            this.fetchValues[key] = await frappe.db.getValue(doctype, name, fieldname);
        }
        return this.fetchValues[key];
    }
};