import telemetry from '@/telemetry/telemetry';
import { Verb } from '@/telemetry/types';
import { DocValue, DocValueMap } from 'frappe/core/types';
import {
  Conflict,
  MandatoryError,
  NotFoundError,
  ValidationError,
} from 'frappe/utils/errors';
import Observable from 'frappe/utils/observable';
import Money from 'pesa/dist/types/src/money';
import {
  Field,
  FieldTypeEnum,
  OptionField,
  Schema,
  TargetField,
} from 'schemas/types';
import { getIsNullOrUndef, getMapFromList } from 'utils';
import frappe from '..';
import { getRandomString, isPesa } from '../utils/index';
import {
  areDocValuesEqual,
  getMissingMandatoryMessage,
  getPreDefaultValues,
  shouldApplyFormula,
} from './helpers';
import { setName } from './naming';
import {
  Action,
  CurrenciesMap,
  DefaultMap,
  DependsOnMap,
  EmptyMessageMap,
  FiltersMap,
  FormulaMap,
  FormulaReturn,
  HiddenMap,
  ListsMap,
  ListViewSettings,
  RequiredMap,
  TreeViewSettings,
  ValidationMap,
} from './types';
import { validateSelect } from './validationFunction';

export default class Doc extends Observable<DocValue | Doc[]> {
  name?: string;
  schema: Readonly<Schema>;
  fieldMap: Record<string, Field>;

  /**
   * Fields below are used by child docs to maintain
   * reference w.r.t their parent doc.
   */
  idx?: number;
  parentdoc?: Doc;
  parentfield?: string;

  _links?: Record<string, Doc>;
  _dirty: boolean = true;
  _notInserted: boolean = true;

  flags = {
    submitAction: false,
    revertAction: false,
  };

  constructor(schema: Schema, data: DocValueMap) {
    super();
    this.schema = schema;
    this._setInitialValues(data);
    this.fieldMap = getMapFromList(schema.fields, 'fieldname');
  }

  get schemaName(): string {
    return this.schema.name;
  }

  get isNew(): boolean {
    return this._notInserted;
  }

  get tableFields(): TargetField[] {
    return this.schema.fields.filter(
      (f) => f.fieldtype === FieldTypeEnum.Table
    ) as TargetField[];
  }

  get dirty() {
    return this._dirty;
  }

  _setInitialValues(data: DocValueMap) {
    for (const fieldname in data) {
      const value = data[fieldname];

      if (Array.isArray(value)) {
        for (const row of value) {
          this.push(fieldname, row);
        }
      } else {
        this[fieldname] = value;
      }
    }

    // set unset fields as null
    for (const field of this.schema.fields) {
      if (this[field.fieldname] === undefined) {
        this[field.fieldname] = null;
      }
    }
  }

  setDirty(value: boolean) {
    this._dirty = value;
    if (this.schema.isChild && this.parentdoc) {
      this.parentdoc._dirty = value;
    }
  }

  // set value and trigger change
  async set(fieldname: string | DocValueMap, value?: DocValue | Doc[]) {
    if (typeof fieldname === 'object') {
      this.setMultiple(fieldname as DocValueMap);
      return;
    }

    if (fieldname === 'numberSeries' && !this._notInserted) {
      return;
    }

    if (value === undefined) {
      return;
    }

    if (
      this.fieldMap[fieldname] === undefined ||
      (this[fieldname] !== undefined &&
        areDocValuesEqual(this[fieldname] as DocValue, value as DocValue))
    ) {
      return;
    }

    this.setDirty(true);
    if (Array.isArray(value)) {
      this[fieldname] = value.map((row, i) => {
        row.idx = i;
        return row;
      });
    } else {
      const field = this.fieldMap[fieldname];
      await this.validateField(field, value);
      this[fieldname] = value;
    }

    // always run applyChange from the parentdoc
    if (this.schema.isChild && this.parentdoc) {
      await this.applyChange(fieldname);
      await this.parentdoc.applyChange(this.parentfield as string);
    } else {
      await this.applyChange(fieldname);
    }
  }

  async setMultiple(docValueMap: DocValueMap) {
    for (const fieldname in docValueMap) {
      await this.set(fieldname, docValueMap[fieldname] as DocValue | Doc[]);
    }
  }

  async applyChange(fieldname: string) {
    await this.applyFormula(fieldname);
    await this.trigger('change', {
      doc: this,
      changed: fieldname,
    });
  }

  setDefaults() {
    for (const field of this.schema.fields) {
      if (!getIsNullOrUndef(this[field.fieldname])) {
        continue;
      }

      let defaultValue: DocValue | Doc[] = getPreDefaultValues(field.fieldtype);
      const defaultFunction = this.defaults[field.fieldname];

      if (defaultFunction !== undefined) {
        defaultValue = defaultFunction();
      } else if (field.default !== undefined) {
        defaultValue = field.default;
      }

      if (field.fieldtype === 'Currency' && !isPesa(defaultValue)) {
        defaultValue = frappe.pesa!(defaultValue as string | number);
      }

      this[field.fieldname] = defaultValue;
    }
  }

  append(fieldname: string, docValueMap: Doc | DocValueMap = {}) {
    // push child row and trigger change
    this.push(fieldname, docValueMap);
    this._dirty = true;
    this.applyChange(fieldname);
  }

  push(fieldname: string, docValueMap: Doc | DocValueMap = {}) {
    // push child row without triggering change
    this[fieldname] ??= [];
    const childDoc = this._initChild(docValueMap, fieldname);
    (this[fieldname] as Doc[]).push(childDoc);
  }

  _initChild(docValueMap: Doc | DocValueMap, fieldname: string): Doc {
    if (docValueMap instanceof Doc) {
      return docValueMap;
    }

    const data: Record<string, unknown> = Object.assign({}, docValueMap);

    data.parent = this.name;
    data.parenttype = this.schemaName;
    data.parentfield = fieldname;
    data.parentdoc = this;

    if (!data.idx) {
      data.idx = ((this[fieldname] as Doc[]) || []).length;
    }

    if (!data.name) {
      data.name = getRandomString();
    }

    const childSchemaName = this.fieldMap[fieldname] as TargetField;
    const schema = frappe.db.schemaMap[childSchemaName.target] as Schema;
    const childDoc = new Doc(schema, data as DocValueMap);
    childDoc.setDefaults();
    return childDoc;
  }

  async validateInsert() {
    this.validateMandatory();
    await this.validateFields();
  }

  validateMandatory() {
    const checkForMandatory: Doc[] = [this];
    const tableFields = this.schema.fields.filter(
      (f) => f.fieldtype === FieldTypeEnum.Table
    ) as TargetField[];

    for (const field of tableFields) {
      const childDocs = this.get(field.fieldname) as Doc[];
      checkForMandatory.push(...childDocs);
    }

    const missingMandatoryMessage = checkForMandatory
      .map((doc) => getMissingMandatoryMessage(doc))
      .filter(Boolean);

    if (missingMandatoryMessage.length > 0) {
      const fields = missingMandatoryMessage.join('\n');
      const message = frappe.t`Value missing for ${fields}`;
      throw new MandatoryError(message);
    }
  }

  async validateFields() {
    const fields = this.schema.fields;
    for (const field of fields) {
      if (field.fieldtype === FieldTypeEnum.Table) {
        continue;
      }

      const value = this.get(field.fieldname) as DocValue;
      await this.validateField(field, value);
    }
  }

  async validateField(field: Field, value: DocValue) {
    if (field.fieldtype == 'Select') {
      validateSelect(field as OptionField, value as string);
    }

    if (value === null || value === undefined) {
      return;
    }

    const validator = this.validations[field.fieldname];
    if (validator === undefined) {
      return;
    }

    await validator(value);
  }

  getValidDict(): DocValueMap {
    const data: DocValueMap = {};
    for (const field of this.schema.fields) {
      let value = this[field.fieldname] as DocValue | DocValueMap[];

      if (Array.isArray(value)) {
        value = value.map((doc) => (doc as Doc).getValidDict());
      }

      if (isPesa(value)) {
        value = (value as Money).copy();
      }

      data[field.fieldname] = value;
    }
    return data;
  }

  setBaseMetaValues() {
    if (this.schema.isSubmittable && typeof this.submitted !== 'boolean') {
      this.submitted = false;
      this.cancelled = false;
    }

    if (!this.createdBy) {
      this.createdBy = frappe.auth.session.user;
    }

    if (!this.created) {
      this.created = new Date();
    }

    this.updateModified();
  }

  updateModified() {
    this.modifiedBy = frappe.auth.session.user;
    this.modified = new Date();
  }

  async load() {
    if (this.name === undefined) {
      return;
    }

    const data = await frappe.db.get(this.schemaName, this.name);
    if (data && data.name) {
      this.syncValues(data);
      if (this.schema.isSingle) {
        this.setDefaults();
      }

      await this.loadLinks();
    } else {
      throw new NotFoundError(`Not Found: ${this.schemaName} ${this.name}`);
    }
  }

  async loadLinks() {
    this._links = {};
    const inlineLinks = this.schema.fields.filter((f) => f.inline);
    for (const f of inlineLinks) {
      await this.loadLink(f.fieldname);
    }
  }

  async loadLink(fieldname: string) {
    this._links ??= {};
    const field = this.fieldMap[fieldname] as TargetField;
    if (field === undefined) {
      return;
    }

    const value = this.get(fieldname);
    if (getIsNullOrUndef(value) || field.target === undefined) {
      return;
    }

    this._links[fieldname] = await frappe.doc.getDoc(
      field.target,
      value as string
    );
  }

  getLink(fieldname: string) {
    return this._links ? this._links[fieldname] : null;
  }

  syncValues(data: DocValueMap) {
    this.clearValues();
    this._setInitialValues(data);
    this._dirty = false;
    this.trigger('change', {
      doc: this,
    });
  }

  clearValues() {
    for (const { fieldname } of this.schema.fields) {
      this[fieldname] = null;
    }

    this._dirty = true;
    this._notInserted = true;
  }

  setChildIdx() {
    const childFields = this.schema.fields.filter(
      (f) => f.fieldtype === FieldTypeEnum.Table
    ) as TargetField[];

    for (const field of childFields) {
      const childDocs = (this.get(field.fieldname) as Doc[]) ?? [];

      for (let i = 0; i < childDocs.length; i++) {
        childDocs[i].idx = i;
      }
    }
  }

  async compareWithCurrentDoc() {
    if (this.isNew || !this.name) {
      return;
    }

    const currentDoc = await frappe.db.get(this.schemaName, this.name);

    // check for conflict
    if (
      currentDoc &&
      (this.modified as Date) !== (currentDoc.modified as Date)
    ) {
      throw new Conflict(
        frappe.t`Document ${this.schemaName} ${this.name} has been modified after loading`
      );
    }

    if (this.submitted && !this.schema.isSubmittable) {
      throw new ValidationError(
        frappe.t`Document type ${this.schemaName} is not submittable`
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

  async applyFormula(fieldname?: string) {
    if (fieldname && this.formulas[fieldname] === undefined) {
      return false;
    }

    const doc = this;
    let changed = false;

    const childDocs = this.tableFields
      .map((f) => (this.get(f.fieldname) as Doc[]) ?? [])
      .flat();

    // children
    for (const row of childDocs) {
      const formulaFields = Object.keys(this.formulas).map(
        (fn) => this.fieldMap[fn]
      );

      changed ||= await this.applyFormulaForFields(
        formulaFields,
        row,
        fieldname
      );
    }

    // parent or child row
    const formulaFields = Object.keys(this.formulas).map(
      (fn) => this.fieldMap[fn]
    );
    changed ||= await this.applyFormulaForFields(formulaFields, doc, fieldname);
    return changed;
  }

  async applyFormulaForFields(
    formulaFields: Field[],
    doc: Doc,
    fieldname?: string
  ) {
    let changed = false;
    for (const field of formulaFields) {
      if (!shouldApplyFormula(field, doc, fieldname)) {
        continue;
      }

      const newVal = await this.getValueFromFormula(field, doc);
      const previousVal = doc.get(field.fieldname);
      const isSame = areDocValuesEqual(newVal as DocValue, previousVal);
      if (newVal === undefined || isSame) {
        continue;
      }

      doc[field.fieldname] = newVal;
      changed = true;
    }

    return changed;
  }

  async getValueFromFormula(field: Field, doc: Doc) {
    let value: FormulaReturn;

    const formula = doc.formulas[field.fieldtype];
    if (formula === undefined) {
      return;
    }

    value = await formula();
    if (Array.isArray(value) && field.fieldtype === FieldTypeEnum.Table) {
      value = value.map((row) => this._initChild(row, field.fieldname));
    }

    return value;
  }

  async commit() {
    // re-run triggers
    this.setChildIdx();
    await this.applyFormula();
    await this.trigger('validate', null);
  }

  async insert() {
    await setName(this);
    this.setBaseMetaValues();
    await this.commit();
    await this.validateInsert();
    await this.trigger('beforeInsert', null);

    const oldName = this.name!;
    const data = await frappe.db.insert(this.schemaName, this.getValidDict());
    this.syncValues(data);

    if (oldName !== this.name) {
      frappe.doc.removeFromCache(this.schemaName, oldName);
    }

    await this.trigger('afterInsert', null);
    await this.trigger('afterSave', null);

    telemetry.log(Verb.Created, this.schemaName);
    return this;
  }

  async update() {
    await this.compareWithCurrentDoc();
    await this.commit();
    await this.trigger('beforeUpdate');

    // before submit
    if (this.flags.submitAction) await this.trigger('beforeSubmit');
    if (this.flags.revertAction) await this.trigger('beforeRevert');

    // update modifiedBy and modified
    this.updateModified();

    const data = this.getValidDict();
    await frappe.db.update(this.schemaName, data);
    this.syncValues(data);

    await this.trigger('afterUpdate');
    await this.trigger('afterSave');

    // after submit
    if (this.flags.submitAction) await this.trigger('afterSubmit');
    if (this.flags.revertAction) await this.trigger('afterRevert');

    return this;
  }

  async insertOrUpdate() {
    if (this._notInserted) {
      return await this.insert();
    } else {
      return await this.update();
    }
  }

  async delete() {
    await this.trigger('beforeDelete');
    await frappe.db.delete(this.schemaName, this.name!);
    await this.trigger('afterDelete');

    telemetry.log(Verb.Deleted, this.schemaName);
  }

  async submitOrRevert(isSubmit: boolean) {
    const wasSubmitted = this.submitted;
    this.submitted = isSubmit;
    try {
      await this.update();
    } catch (e) {
      this.submitted = wasSubmitted;
      throw e;
    }
  }

  async submit() {
    this.cancelled = false;
    await this.submitOrRevert(true);
  }

  async revert() {
    await this.submitOrRevert(false);
  }

  async rename(newName: string) {
    await this.trigger('beforeRename');
    await frappe.db.rename(this.schemaName, this.name!, newName);
    this.name = newName;
    await this.trigger('afterRename');
  }

  async trigger(event: string, params?: unknown) {
    if (this[event]) {
      await (this[event] as Function)(params);
    }

    await super.trigger(event, params);
  }

  getSum(tablefield: string, childfield: string, convertToFloat = true) {
    const childDocs = (this.get(tablefield) as Doc[]) ?? [];
    const sum = childDocs
      .map((d) => {
        const value = d.get(childfield) ?? 0;
        if (!isPesa(value)) {
          try {
            return frappe.pesa(value as string | number);
          } catch (err) {
            (
              err as Error
            ).message += ` value: '${value}' of type: ${typeof value}, fieldname: '${tablefield}', childfield: '${childfield}'`;
            throw err;
          }
        }
        return value as Money;
      })
      .reduce((a, b) => a.add(b), frappe.pesa(0));

    if (convertToFloat) {
      return sum.float;
    }
    return sum;
  }

  getFrom(schemaName: string, name: string, fieldname: string) {
    if (name === undefined || fieldname === undefined) {
      return '';
    }

    return frappe.doc.getCachedValue(schemaName, name, fieldname);
  }

  async duplicate(shouldInsert: boolean = true): Promise<Doc> {
    const updateMap: DocValueMap = {};
    const docValueMap = this.getValidDict();
    const fieldnames = this.schema.fields.map((f) => f.fieldname);

    for (const fn of fieldnames) {
      const value = docValueMap[fn];
      if (getIsNullOrUndef(value)) {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((row) => {
          delete row.name;
          delete row.parent;
        });
      }

      updateMap[fn] = value;
    }

    if (this.numberSeries) {
      delete updateMap.name;
    } else {
      updateMap.name = updateMap.name + ' CPY';
    }

    const doc = frappe.doc.getEmptyDoc(this.schemaName, false);
    await doc.setMultiple(updateMap);

    if (shouldInsert) {
      await doc.insert();
    }

    return doc;
  }

  formulas: FormulaMap = {};
  defaults: DefaultMap = {};
  validations: ValidationMap = {};
  required: RequiredMap = {};
  hidden: HiddenMap = {};
  dependsOn: DependsOnMap = {};
  getCurrencies: CurrenciesMap = {};

  static lists: ListsMap = {};
  static filters: FiltersMap = {};
  static emptyMessages: EmptyMessageMap = {};
  static listSettings: ListViewSettings = {};
  static treeSettings?: TreeViewSettings;

  static actions: Action[] = [];
}
