const BaseDocument = require('./document');
const frappe = require('frappejs');
const model = require('./index');
const indicatorColor = require('frappejs/ui/constants/indicators');

module.exports = class BaseMeta extends BaseDocument {
  constructor(data) {
    if (data.basedOn) {
      let config = frappe.models[data.basedOn];
      Object.assign(data, config, {
        name: data.name,
        label: data.label,
        filters: data.filters
      });
    }
    super(data);
    this.setDefaultIndicators();
    if (this.setupMeta) {
      this.setupMeta();
    }
    if (!this.titleField) {
      this.titleField = 'name';
    }
  }

  setValues(data) {
    Object.assign(this, data);
    this.processFields();
  }

  processFields() {
    // add name field
    if (!this.fields.find(df => df.fieldname === 'name') && !this.isSingle) {
      this.fields = [
        {
          label: frappe._('ID'),
          fieldname: 'name',
          fieldtype: 'Data',
          required: 1,
          readOnly: 1
        }
      ].concat(this.fields);
    }

    this.fields = this.fields.map(df => {
      // name field is always required
      if (df.fieldname === 'name') {
        df.required = 1;
      }

      // attach default precision to Float and Currency
      if (['Float', 'Currency'].includes(df.fieldtype)) {
        let defaultPrecision = frappe.SystemSettings
          ? frappe.SystemSettings.floatPrecision
          : 2;
        df.precision = df.precision || defaultPrecision;
      }
      return df;
    });
  }

  hasField(fieldname) {
    return this.getField(fieldname) ? true : false;
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

  /**
   * Get fields filtered by filters
   * @param {Object} filters
   *
   * Usage:
   *   meta = frappe.getMeta('ToDo')
   *   dataFields = meta.getFieldsWith({ fieldtype: 'Data' })
   */
  getFieldsWith(filters) {
    return this.fields.filter(df => {
      let match = true;
      for (const key in filters) {
        const value = filters[key];
        match = df[key] === value;
      }
      return match;
    });
  }

  getLabel(fieldname) {
    let df = this.getField(fieldname);
    return df.getLabel || df.label;
  }

  getTableFields() {
    if (this._tableFields === undefined) {
      this._tableFields = this.fields.filter(
        field => field.fieldtype === 'Table'
      );
    }
    return this._tableFields;
  }

  getFormulaFields() {
    if (this._formulaFields === undefined) {
      this._formulaFields = this.fields.filter(field => field.formula);
    }
    return this._formulaFields;
  }

  hasFormula() {
    if (this._hasFormula === undefined) {
      this._hasFormula = false;
      if (this.getFormulaFields().length) {
        this._hasFormula = true;
      } else {
        for (let tablefield of this.getTableFields()) {
          if (frappe.getMeta(tablefield.childtype).getFormulaFields().length) {
            this._hasFormula = true;
            break;
          }
        }
      }
    }
    return this._hasFormula;
  }

  getBaseDocType() {
    return this.basedOn || this.name;
  }

  async set(fieldname, value) {
    this[fieldname] = value;
    await this.trigger(fieldname);
  }

  get(fieldname) {
    return this[fieldname];
  }

  getValidFields({ withChildren = true } = {}) {
    if (!this._validFields) {
      this._validFields = [];
      this._validFieldsWithChildren = [];

      const _add = field => {
        this._validFields.push(field);
        this._validFieldsWithChildren.push(field);
      };

      // fields validation
      this.fields.forEach((df, i) => {
        if (!df.fieldname) {
          throw new frappe.errors.ValidationError(
            `DocType ${this.name}: "fieldname" is required for field at index ${i}`
          );
        }
        if (!df.fieldtype) {
          throw new frappe.errors.ValidationError(
            `DocType ${this.name}: "fieldtype" is required for field "${df.fieldname}"`
          );
        }
      });

      const doctypeFields = this.fields.map(field => field.fieldname);

      // standard fields
      for (let field of model.commonFields) {
        if (
          frappe.db.typeMap[field.fieldtype] &&
          !doctypeFields.includes(field.fieldname)
        ) {
          _add(field);
        }
      }

      if (this.isSubmittable) {
        _add({
          fieldtype: 'Check',
          fieldname: 'submitted',
          label: frappe._('Submitted')
        });
      }

      if (this.isChild) {
        // child fields
        for (let field of model.childFields) {
          if (
            frappe.db.typeMap[field.fieldtype] &&
            !doctypeFields.includes(field.fieldname)
          ) {
            _add(field);
          }
        }
      } else {
        // parent fields
        for (let field of model.parentFields) {
          if (
            frappe.db.typeMap[field.fieldtype] &&
            !doctypeFields.includes(field.fieldname)
          ) {
            _add(field);
          }
        }
      }

      if (this.isTree) {
        // tree fields
        for (let field of model.treeFields) {
          if (
            frappe.db.typeMap[field.fieldtype] &&
            !doctypeFields.includes(field.fieldname)
          ) {
            _add(field);
          }
        }
      }

      // doctype fields
      for (let field of this.fields) {
        let include = frappe.db.typeMap[field.fieldtype];

        if (include) {
          _add(field);
        }

        // include tables if (withChildren = True)
        if (!include && field.fieldtype === 'Table') {
          this._validFieldsWithChildren.push(field);
        }
      }
    }

    if (withChildren) {
      return this._validFieldsWithChildren;
    } else {
      return this._validFields;
    }
  }

  getKeywordFields() {
    if (!this._keywordFields) {
      this._keywordFields = this.keywordFields;
      if (!(this._keywordFields && this._keywordFields.length && this.fields)) {
        this._keywordFields = this.fields
          .filter(field => field.fieldtype !== 'Table' && field.required)
          .map(field => field.fieldname);
      }
      if (!(this._keywordFields && this._keywordFields.length)) {
        this._keywordFields = ['name'];
      }
    }
    return this._keywordFields;
  }

  getQuickEditFields() {
    if (this.quickEditFields) {
      return this.quickEditFields.map(fieldname => this.getField(fieldname));
    }
    return this.getFieldsWith({ required: 1 });
  }

  validateSelect(field, value) {
    let options = field.options;
    if (!options) return;
    if (!field.required && value == null) {
      return;
    }

    let validValues = options;

    if (typeof options === 'string') {
      // values given as string
      validValues = options.split('\n');
    }
    if (typeof options[0] === 'object') {
      // options as array of {label, value} pairs
      validValues = options.map(o => o.value);
    }
    if (!validValues.includes(value)) {
      throw new frappe.errors.ValueError(
        // prettier-ignore
        `DocType ${this.name}: Invalid value "${value}" for "${field.label}". Must be one of ${options.join(', ')}`
      );
    }
    return value;
  }

  async trigger(event, params = {}) {
    Object.assign(params, {
      doc: this,
      name: event
    });

    await super.trigger(event, params);
  }

  setDefaultIndicators() {
    if (!this.indicators) {
      if (this.isSubmittable) {
        this.indicators = {
          key: 'submitted',
          colors: {
            0: indicatorColor.GRAY,
            1: indicatorColor.BLUE
          }
        };
      }
    }
  }

  getIndicatorColor(doc) {
    if (frappe.isDirty(this.name, doc.name)) {
      return indicatorColor.ORANGE;
    } else {
      if (this.indicators) {
        let value = doc[this.indicators.key];
        if (value) {
          return this.indicators.colors[value] || indicatorColor.GRAY;
        } else {
          return indicatorColor.GRAY;
        }
      } else {
        return indicatorColor.GRAY;
      }
    }
  }
};
