const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');
const naming = require('./naming');

module.exports = class BaseDocument extends Observable {
  constructor(data) {
    super();
    this.fetchValuesCache = {};
    this.flags = {};
    this.setup();
    this.setValues(data);

    // clear fetch-values cache
    frappe.db.on(
      'change',
      params => (this.fetchValuesCache[`${params.doctype}:${params.name}`] = {})
    );
  }

  setup() {
    // add listeners
  }

  setValues(data) {
    for (let fieldname in data) {
      let value = data[fieldname];
      if (fieldname.startsWith('_')) {
        // private property
        this[fieldname] = value;
      } else if (Array.isArray(value)) {
        for (let row of value) {
          this.append(fieldname, row);
        }
      } else {
        this[fieldname] = value;
      }
    }
    // set unset fields as null
    for (let field of this.meta.getValidFields()) {
      // check for null or undefined
      if (this[field.fieldname] == null) {
        this[field.fieldname] = null;
      }
    }
  }

  get meta() {
    if (this.isCustom) {
      this._meta = frappe.createMeta(this.fields);
    }
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

  // set value and trigger change
  async set(fieldname, value) {
    if (typeof fieldname === 'object') {
      const valueDict = fieldname;
      for (let fieldname in valueDict) {
        await this.set(fieldname, valueDict[fieldname]);
      }
      return;
    }

    if (this[fieldname] !== value) {
      this._dirty = true;
      if (Array.isArray(value)) {
        this[fieldname] = [];
        for (let row of value) {
          this.append(fieldname, row);
        }
      } else {
        this[fieldname] = await this.validateField(fieldname, value);
      }
      await this.applyChange(fieldname);
    }
  }

  async applyChange(fieldname) {
    if (await this.applyFormula()) {
      // multiple changes
      await this.trigger('change', {
        doc: this,
        changed: fieldname
      });
    } else {
      // no other change, trigger control refresh
      await this.trigger('change', {
        doc: this,
        fieldname: fieldname,
        changed: fieldname
      });
    }
  }

  setDefaults() {
    for (let field of this.meta.fields) {
      if (this[field.fieldname] == null) {
        let defaultValue = null;

        if (field.fieldtype === 'Table') {
          defaultValue = [];
        }
        if (field.default) {
          defaultValue = field.default;
        }

        this[field.fieldname] = defaultValue;
      }
    }

    if (this.meta.basedOn && this.meta.filters) {
      this.setValues(this.meta.filters);
    }
  }

  setKeywords() {
    let keywords = [];
    for (let fieldname of this.meta.getKeywordFields()) {
      keywords.push(this[fieldname]);
    }
    this.keywords = keywords.join(', ');
  }

  append(key, document = {}) {
    if (!this[key]) {
      this[key] = [];
    }
    this[key].push(this._initChild(document, key));
    this._dirty = true;
    this.applyChange(key);
  }

  _initChild(data, key) {
    if (data instanceof BaseDocument) {
      return data;
    } else {
      data.doctype = this.meta.getField(key).childtype;
      data.parent = this.name;
      data.parenttype = this.doctype;
      data.parentfield = key;
      data.parentdoc = this;

      if (!data.idx) {
        data.idx = (this[key] || []).length;
      }

      if (!data.name) {
        data.name = frappe.getRandomString();
      }

      return new BaseDocument(data);
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
      let value = this[field.fieldname];
      if (Array.isArray(value)) {
        value = value.map(doc => doc.getValidDict ? doc.getValidDict() : doc);
      }
      data[field.fieldname] = value;
    }
    return data;
  }

  getFullDict() {
    let data = this.getValidDict();
    return data;
  }

  setStandardValues() {
    // set standard values on server-side only
    if (frappe.isServer) {
      let now = new Date().toISOString();
      if (!this.submitted) {
        this.submitted = 0;
      }

      if (!this.owner) {
        this.owner = frappe.session.user;
      }

      if (!this.creation) {
        this.creation = now;
      }

      if (!this.modifiedBy) {
        this.modifiedBy = frappe.session.user;
      }
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
      await this.loadLinks();
    } else {
      throw new frappe.errors.NotFoundError(
        `Not Found: ${this.doctype} ${this.name}`
      );
    }
  }

  async loadLinks() {
    this._links = {};
    let inlineLinks = this.meta.fields.filter(df => df.inline);
    for (let df of inlineLinks) {
      if (this[df.fieldname]) {
        this._links[df.fieldname] = await frappe.getDoc(
          df.target,
          this[df.fieldname]
        );
      }
    }
  }

  getLink(fieldname) {
    return this._links ? this._links[fieldname] : null;
  }

  syncValues(data) {
    this.clearValues();
    this.setValues(data);
    this._dirty = false;
    this.trigger('change', {
      doc: this
    });
  }

  clearValues() {
    let toClear = ['_dirty', '_notInserted'].concat(
      this.meta.getValidFields().map(df => df.fieldname)
    );
    for (let key of toClear) {
      this[key] = null;
    }
  }

  setChildIdx() {
    // renumber children
    for (let field of this.meta.getValidFields()) {
      if (field.fieldtype === 'Table') {
        for (let i = 0; i < (this[field.fieldname] || []).length; i++) {
          this[field.fieldname][i].idx = i;
        }
      }
    }
  }

  async compareWithCurrentDoc() {
    if (frappe.isServer && !this.isNew()) {
      let currentDoc = await frappe.db.get(this.doctype, this.name);

      // check for conflict
      if (currentDoc && this.modified != currentDoc.modified) {
        throw new frappe.errors.Conflict(
          frappe._('Document {0} {1} has been modified after loading', [
            this.doctype,
            this.name
          ])
        );
      }

      if (this.submitted && !this.meta.isSubmittable) {
        throw new frappe.errors.ValidationError(
          frappe._('Document type {1} is not submittable', [this.doctype])
        );
      }

      // set submit action flag
      if (this.submitted && !currentDoc.submitted) {
        this.flags.submitAction = true;
      }

      if (currentDoc.submitted && !this.submitted) {
        this.flags.revertAction = true;
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
      let formulaFields = frappe
        .getMeta(tablefield.childtype)
        .getFormulaFields();
      if (formulaFields.length) {
        // for each row
        for (let row of this[tablefield.fieldname]) {
          for (let field of formulaFields) {
            if (shouldApplyFormula(field, row)) {
              const val = await field.formula(row, doc);
              if (val !== false && val !== undefined) {
                row[field.fieldname] = val;
              }
            }
          }
        }
      }
    }

    // parent or child row
    for (let field of this.meta.getFormulaFields()) {
      if (shouldApplyFormula(field, doc)) {
        let val;
        if (this.meta.isChild) {
          val = await field.formula(doc, this.parentdoc);
        } else {
          val = await field.formula(doc);
        }
        if (val !== false && val !== undefined) {
          doc[field.fieldname] = val;
        }
      }
    }

    return true;

    function shouldApplyFormula(field, doc) {
      if (field.readOnly) {
        return true;
      }

      if (!frappe.isServer || frappe.isElectron) {
        if (doc[field.fieldname] == null || doc[field.fieldname] == '') {
          return true;
        }
      }
      return false;
    }
  }

  async setName() {
    await naming.setName(this);
  }

  async commit() {
    // re-run triggers
    this.setStandardValues();
    this.setKeywords();
    this.setChildIdx();
    await this.applyFormula();
    await this.trigger('validate');
  }

  async insert() {
    await this.setName();
    await this.commit();
    await this.trigger('beforeInsert');

    let oldName = this.name;
    const data = await frappe.db.insert(this.doctype, this.getValidDict());
    this.syncValues(data);

    if (oldName !== this.name) {
      frappe.removeFromCache(this.doctype, oldName);
    }

    await this.trigger('afterInsert');
    await this.trigger('afterSave');

    return this;
  }

  async update() {
    await this.compareWithCurrentDoc();
    await this.commit();
    await this.trigger('beforeUpdate');

    // before submit
    if (this.flags.submitAction) await this.trigger('beforeSubmit');
    if (this.flags.revertAction) await this.trigger('beforeRevert');

    const data = await frappe.db.update(this.doctype, this.getValidDict());
    this.syncValues(data);

    await this.trigger('afterUpdate');
    await this.trigger('afterSave');

    // after submit
    if (this.flags.submitAction) await this.trigger('afterSubmit');
    if (this.flags.revertAction) await this.trigger('afterRevert');

    return this;
  }

  insertOrUpdate() {
    if (this._notInserted) {
      return this.insert();
    } else {
      return this.update();
    }
  }

  async delete() {
    await this.trigger('beforeDelete');
    await frappe.db.delete(this.doctype, this.name);
    await this.trigger('afterDelete');
  }

  async submit() {
    this.submitted = 1;
    this.update();
  }

  async revert() {
    this.submitted = 0;
    this.update();
  }

  async rename(newName) {
    await this.trigger('beforeRename');
    await frappe.db.rename(this.doctype, this.name, newName);
    this.name = newName;
    await this.trigger('afterRename');
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
    return this[tablefield]
      .map(d => parseFloat(d[childfield], 10) || 0)
      .reduce((a, b) => a + b, 0);
  }

  async getFrom(doctype, name, fieldname) {
    if (!name) return '';
    let _values =
      this.fetchValuesCache[`${doctype}:${name}`] ||
      (this.fetchValuesCache[`${doctype}:${name}`] = {});
    if (!_values[fieldname]) {
      _values[fieldname] = await frappe.db.getValue(doctype, name, fieldname);
    }
    return _values[fieldname];
  }

  isNew() {
    return this._notInserted;
  }
};
