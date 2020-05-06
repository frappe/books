const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');
const naming = require('./naming');
const { round } = require('frappejs/utils/numberFormat');

module.exports = class BaseDocument extends Observable {
  constructor(data) {
    super();
    this.fetchValuesCache = {};
    this.flags = {};
    this.setup();
    this.setValues(data);
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
          this.push(fieldname, row);
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
      // if child is dirty, parent is dirty too
      if (this.meta.isChild && this.parentdoc) {
        this.parentdoc._dirty = true;
      }

      if (Array.isArray(value)) {
        this[fieldname] = [];
        value.forEach((row, i) => {
          this.append(fieldname, row);
          row.idx = i;
        });
      } else {
        await this.validateField(fieldname, value);
        this[fieldname] = value;
      }

      // always run applyChange from the parentdoc
      if (this.meta.isChild && this.parentdoc) {
        await this.parentdoc.applyChange(this.parentfield);
      } else {
        await this.applyChange(fieldname);
      }
    }
  }

  async applyChange(fieldname) {
    await this.applyFormula(fieldname);
    this.roundFloats();
    await this.trigger('change', {
      doc: this,
      changed: fieldname
    });
  }

  setDefaults() {
    for (let field of this.meta.fields) {
      if (this[field.fieldname] == null) {
        let defaultValue = null;

        if (field.fieldtype === 'Table') {
          defaultValue = [];
        }
        if (field.default) {
          if (typeof field.default === 'function') {
            defaultValue = field.default(this);
          } else {
            defaultValue = field.default;
          }
        }

        this[field.fieldname] = defaultValue;
      }
    }

    if (this.meta.basedOn && this.meta.filters) {
      this.setValues(this.meta.filters);
    }
  }

  castValues() {
    for (let field of this.meta.fields) {
      let value = this[field.fieldname];
      if (value == null) {
        continue;
      }
      if (['Int', 'Check'].includes(field.fieldtype)) {
        value = parseInt(value, 10);
      } else if (['Float', 'Currency'].includes(field.fieldtype)) {
        value = parseFloat(value);
      }
      this[field.fieldname] = value;
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
    // push child row and trigger change
    this.push(key, document);
    this._dirty = true;
    this.applyChange(key);
  }

  push(key, document = {}) {
    // push child row without triggering change
    if (!this[key]) {
      this[key] = [];
    }
    this[key].push(this._initChild(document, key));
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

  validateInsert() {
    this.validateMandatory();
    this.validateFields();
  }

  validateMandatory() {
    let checkForMandatory = [this];
    let tableFields = this.meta.fields.filter(df => df.fieldtype === 'Table');
    tableFields.map(df => {
      let rows = this[df.fieldname];
      checkForMandatory = [...checkForMandatory, ...rows];
    });

    let missingMandatory = checkForMandatory
      .map(doc => getMissingMandatory(doc))
      .filter(Boolean);

    if (missingMandatory.length > 0) {
      let fields = missingMandatory.join('\n');
      let message = frappe._('Value missing for {0}', fields);
      throw new frappe.errors.MandatoryError(message);
    }

    function getMissingMandatory(doc) {
      let mandatoryFields = doc.meta.fields.filter(df => df.required);
      let message = mandatoryFields
        .filter(df => {
          let value = doc[df.fieldname];
          if (df.fieldtype === 'Table') {
            return value == null || value.length === 0;
          }
          return value == null || value === '';
        })
        .map(df => {
          return `"${df.label}"`;
        })
        .join(', ');

      if (message && doc.meta.isChild) {
        let parentfield = doc.parentdoc.meta.getField(doc.parentfield);
        message = `${parentfield.label} Row ${doc.idx + 1}: ${message}`;
      }

      return message;
    }
  }

  async validateFields() {
    let fields = this.meta.fields;
    for (let field of fields) {
      await this.validateField(field.fieldname, this.get(field.fieldname));
    }
  }

  async validateField(key, value) {
    let field = this.meta.getField(key);
    if (!field) {
      throw new frappe.errors.InvalidFieldError(`Invalid field ${key}`);
    }
    if (field.fieldtype == 'Select') {
      this.meta.validateSelect(field, value);
    }
    if (field.validate && value != null) {
      let validator = null;
      if (typeof field.validate === 'object') {
        validator = this.getValidateFunction(field.validate);
      }
      if (typeof field.validate === 'function') {
        validator = field.validate;
      }
      if (validator) {
        await validator(value, this);
      }
    }
  }

  getValidateFunction(validator) {
    let functions = {
      email(value) {
        let isValid = /(.+)@(.+){2,}\.(.+){2,}/.test(value);
        if (!isValid) {
          throw new frappe.errors.ValidationError(`Invalid email: ${value}`);
        }
      },
      phone(value) {
        let isValid = /[+]{0,1}[\d ]+/.test(value);
        if (!isValid) {
          throw new frappe.errors.ValidationError(`Invalid phone: ${value}`);
        }
      }
    };

    return functions[validator.type];
  }

  getValidDict() {
    let data = {};
    for (let field of this.meta.getValidFields()) {
      let value = this[field.fieldname];
      if (Array.isArray(value)) {
        value = value.map(doc => (doc.getValidDict ? doc.getValidDict() : doc));
      }
      data[field.fieldname] = value;
    }
    return data;
  }

  setStandardValues() {
    // set standard values on server-side only
    if (frappe.isServer) {
      if (this.isSubmittable && this.submitted == null) {
        this.submitted = 0;
      }

      let now = new Date().toISOString();
      if (!this.owner) {
        this.owner = frappe.session.user;
      }

      if (!this.creation) {
        this.creation = now;
      }

      this.updateModified();
    }
  }

  updateModified() {
    if (frappe.isServer) {
      let now = new Date().toISOString();
      this.modifiedBy = frappe.session.user;
      this.modified = now;
    }
  }

  async load() {
    let data = await frappe.db.get(this.doctype, this.name);
    if (data && data.name) {
      this.syncValues(data);
      if (this.meta.isSingle) {
        this.setDefaults();
        this.castValues();
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
      await this.loadLink(df.fieldname);
    }
  }

  async loadLink(fieldname) {
    this._links = this._links || {};
    let df = this.meta.getField(fieldname);
    if (this[df.fieldname]) {
      this._links[df.fieldname] = await frappe.getDoc(
        df.target,
        this[df.fieldname]
      );
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

  async applyFormula(fieldname) {
    if (!this.meta.hasFormula()) {
      return false;
    }

    let doc = this;
    let changed = false;

    // children
    for (let tablefield of this.meta.getTableFields()) {
      let formulaFields = frappe
        .getMeta(tablefield.childtype)
        .getFormulaFields();
      if (formulaFields.length) {
        // for each row
        for (let row of this[tablefield.fieldname] || []) {
          for (let field of formulaFields) {
            if (shouldApplyFormula(field, row)) {
              let val = await this.getValueFromFormula(field, row);
              let previousVal = row[field.fieldname];
              if (val !== undefined && previousVal !== val) {
                row[field.fieldname] = val;
                changed = true;
              }
            }
          }
        }
      }
    }

    // parent or child row
    for (let field of this.meta.getFormulaFields()) {
      if (shouldApplyFormula(field, doc)) {
        let previousVal = doc[field.fieldname];
        let val = await this.getValueFromFormula(field, doc);
        if (val !== undefined && previousVal !== val) {
          doc[field.fieldname] = val;
          changed = true;
        }
      }
    }

    return changed;

    function shouldApplyFormula(field, doc) {
      if (field.readOnly) {
        return true;
      }
      if (
        fieldname &&
        field.formulaDependsOn &&
        field.formulaDependsOn.includes(fieldname)
      ) {
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

  async getValueFromFormula(field, doc) {
    let value;

    if (doc.meta.isChild) {
      value = await field.formula(doc, doc.parentdoc);
    } else {
      value = await field.formula(doc);
    }

    if (value === undefined) {
      return;
    }

    if (['Float', 'Currency'].includes(field.fieldtype)) {
      value = this.round(value, field);
    }

    if (field.fieldtype === 'Table' && Array.isArray(value)) {
      value = value.map(row => {
        let doc = this._initChild(row, field.fieldname);
        doc.roundFloats();
        return doc;
      });
    }

    return value;
  }

  roundFloats() {
    let fields = this.meta
      .getValidFields()
      .filter(df => ['Float', 'Currency', 'Table'].includes(df.fieldtype));

    for (let df of fields) {
      let value = this[df.fieldname];
      if (value == null) {
        continue;
      }
      // child
      if (Array.isArray(value)) {
        value.map(row => row.roundFloats());
        continue;
      }
      // field
      let roundedValue = this.round(value, df);
      if (roundedValue && value !== roundedValue) {
        this[df.fieldname] = roundedValue;
      }
    }
  }

  async setName() {
    await naming.setName(this);
  }

  async commit() {
    // re-run triggers
    this.setKeywords();
    this.setChildIdx();
    await this.applyFormula();
    await this.trigger('validate');
  }

  async insert() {
    await this.setName();
    this.setStandardValues();
    await this.commit();
    await this.validateInsert();
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

  async update(...args) {
    if (args.length) {
      await this.set(...args);
    }
    await this.compareWithCurrentDoc();
    await this.commit();
    await this.trigger('beforeUpdate');

    // before submit
    if (this.flags.submitAction) await this.trigger('beforeSubmit');
    if (this.flags.revertAction) await this.trigger('beforeRevert');

    // update modifiedBy and modified
    this.updateModified();

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
    return (this[tablefield] || [])
      .map(d => parseFloat(d[childfield], 10) || 0)
      .reduce((a, b) => a + b, 0);
  }

  getFrom(doctype, name, fieldname) {
    if (!name) return '';
    return frappe.db.getCachedValue(doctype, name, fieldname);
  }

  round(value, df = null) {
    if (typeof df === 'string') {
      df = this.meta.getField(df);
    }
    let systemPrecision = frappe.SystemSettings.floatPrecision;
    let defaultPrecision = systemPrecision != null ? systemPrecision : 2;
    let precision =
      df && df.precision != null ? df.precision : defaultPrecision;
    return round(value, precision);
  }

  isNew() {
    return this._notInserted;
  }
};
