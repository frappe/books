import { Fyo } from 'fyo';
import { DocValue, DocValueMap } from 'fyo/core/types';
import { Verb } from 'fyo/telemetry/types';
import { DEFAULT_USER } from 'fyo/utils/consts';
import {
  ConflictError,
  MandatoryError,
  NotFoundError,
  ValidationError,
} from 'fyo/utils/errors';
import Observable from 'fyo/utils/observable';
import Money from 'pesa/dist/types/src/money';
import {
  Field,
  FieldTypeEnum,
  OptionField,
  Schema,
  TargetField,
} from 'schemas/types';
import { getIsNullOrUndef, getMapFromList, getRandomString } from 'utils';
import { markRaw } from 'vue';
import { isPesa } from '../utils/index';
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
  ReadOnlyMap,
  RequiredMap,
  TreeViewSettings,
  ValidationMap,
} from './types';
import { validateSelect } from './validationFunction';

export class Doc extends Observable<DocValue | Doc[]> {
  name?: string;
  schema: Readonly<Schema>;
  fyo: Fyo;
  fieldMap: Record<string, Field>;

  /**
   * Fields below are used by child docs to maintain
   * reference w.r.t their parent doc.
   */
  idx?: number;
  parentdoc?: Doc;
  parentFieldname?: string;
  parentSchemaName?: string;

  _links?: Record<string, Doc>;
  _dirty: boolean = true;
  _notInserted: boolean = true;

  flags = {
    submitAction: false,
    revertAction: false,
  };

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super();
    this.fyo = markRaw(fyo);
    this.schema = schema;
    this.fieldMap = getMapFromList(schema.fields, 'fieldname');

    if (this.schema.isSingle) {
      this.name = this.schemaName;
    }

    this._setDefaults();
    this._setValuesWithoutChecks(data);
  }

  get schemaName(): string {
    return this.schema.name;
  }

  get notInserted(): boolean {
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

  get quickEditFields() {
    let fieldnames = this.schema.quickEditFields;

    if (fieldnames === undefined) {
      fieldnames = [];
    }

    if (fieldnames.length === 0 && this.fieldMap['name']) {
      fieldnames = ['name'];
    }

    return fieldnames.map((f) => this.fieldMap[f]);
  }

  _setValuesWithoutChecks(data: DocValueMap) {
    for (const field of this.schema.fields) {
      const fieldname = field.fieldname;
      const value = data[field.fieldname];

      if (Array.isArray(value)) {
        for (const row of value) {
          this.push(fieldname, row);
        }
      } else {
        this[fieldname] = value ?? this[fieldname] ?? null;
      }
    }
  }

  _setDirty(value: boolean) {
    this._dirty = value;
    if (this.schema.isChild && this.parentdoc) {
      this.parentdoc._dirty = value;
    }
  }

  // set value and trigger change
  async set(fieldname: string | DocValueMap, value?: DocValue | Doc[]) {
    if (typeof fieldname === 'object') {
      await this.setMultiple(fieldname as DocValueMap);
      return;
    }

    if (!this._canSet(fieldname, value)) {
      return;
    }

    this._setDirty(true);
    if (Array.isArray(value)) {
      this[fieldname] = value.map((row, i) => {
        row.idx = i;
        return row;
      });
    } else {
      const field = this.fieldMap[fieldname];
      await this._validateField(field, value);
      this[fieldname] = value;
    }

    // always run applyChange from the parentdoc
    if (this.schema.isChild && this.parentdoc) {
      await this._applyChange(fieldname);
      await this.parentdoc._applyChange(this.parentFieldname as string);
    } else {
      await this._applyChange(fieldname);
    }
  }

  async setMultiple(docValueMap: DocValueMap) {
    for (const fieldname in docValueMap) {
      await this.set(fieldname, docValueMap[fieldname] as DocValue | Doc[]);
    }
  }

  _canSet(fieldname: string, value?: DocValue | Doc[]): boolean {
    if (fieldname === 'numberSeries' && !this.notInserted) {
      return false;
    }

    if (value === undefined) {
      return false;
    }

    if (this.fieldMap[fieldname] === undefined) {
      return false;
    }

    const currentValue = this.get(fieldname);
    if (currentValue === undefined) {
      return true;
    }

    return !areDocValuesEqual(currentValue as DocValue, value as DocValue);
  }

  async _applyChange(fieldname: string) {
    await this._applyFormula(fieldname);
    await this.trigger('change', {
      doc: this,
      changed: fieldname,
    });
  }

  _setDefaults() {
    for (const field of this.schema.fields) {
      let defaultValue: DocValue | Doc[] = getPreDefaultValues(
        field.fieldtype,
        this.fyo
      );

      const defaultFunction =
        this.fyo.models[this.schemaName]?.defaults?.[field.fieldname];
      if (defaultFunction !== undefined) {
        defaultValue = defaultFunction();
      } else if (field.default !== undefined) {
        defaultValue = field.default;
      }

      if (field.fieldtype === FieldTypeEnum.Currency && !isPesa(defaultValue)) {
        defaultValue = this.fyo.pesa!(defaultValue as string | number);
      }

      this[field.fieldname] = defaultValue;
    }
  }

  async append(fieldname: string, docValueMap: Doc | DocValueMap = {}) {
    // push child row and trigger change
    this.push(fieldname, docValueMap);
    this._dirty = true;
    await this._applyChange(fieldname);
  }

  push(fieldname: string, docValueMap: Doc | DocValueMap = {}) {
    // push child row without triggering change
    this[fieldname] ??= [];
    const childDoc = this._getChildDoc(docValueMap, fieldname);
    (this[fieldname] as Doc[]).push(childDoc);
  }

  _getChildDoc(docValueMap: Doc | DocValueMap, fieldname: string): Doc {
    if (docValueMap instanceof Doc) {
      return docValueMap;
    }

    const data: Record<string, unknown> = Object.assign({}, docValueMap);

    data.parent = this.name;
    data.parentSchemaName = this.schemaName;
    data.parentFieldname = fieldname;
    data.parentdoc = this;

    if (!data.idx) {
      data.idx = ((this[fieldname] as Doc[]) || []).length;
    }

    if (!data.name) {
      data.name = getRandomString();
    }

    const targetField = this.fieldMap[fieldname] as TargetField;
    const schema = this.fyo.db.schemaMap[targetField.target] as Schema;
    const childDoc = new Doc(schema, data as DocValueMap, this.fyo);
    return childDoc;
  }

  async _validateInsert() {
    this._validateMandatory();
    await this._validateFields();
  }

  _validateMandatory() {
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
      const message = this.fyo.t`Value missing for ${fields}`;
      throw new MandatoryError(message);
    }
  }

  async _validateFields() {
    const fields = this.schema.fields;
    for (const field of fields) {
      if (field.fieldtype === FieldTypeEnum.Table) {
        continue;
      }

      const value = this.get(field.fieldname) as DocValue;
      await this._validateField(field, value);
    }
  }

  async _validateField(field: Field, value: DocValue) {
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

      if (value === null && this.schema.isSingle) {
        continue;
      }

      data[field.fieldname] = value;
    }
    return data;
  }

  _setBaseMetaValues() {
    if (this.schema.isSubmittable && typeof this.submitted !== 'boolean') {
      this.submitted = false;
      this.cancelled = false;
    }

    if (!this.createdBy) {
      this.createdBy = this.fyo.auth.session.user || DEFAULT_USER;
    }

    if (!this.created) {
      this.created = new Date();
    }

    this._updateModifiedMetaValues();
  }

  _updateModifiedMetaValues() {
    this.modifiedBy = this.fyo.auth.session.user || DEFAULT_USER;
    this.modified = new Date();
  }

  async load() {
    if (this.name === undefined) {
      return;
    }

    const data = await this.fyo.db.get(this.schemaName, this.name);
    if (this.schema.isSingle && !data?.name) {
      data.name = this.name!;
    }

    if (data && data.name) {
      this._syncValues(data);
      await this.loadLinks();
    } else {
      throw new NotFoundError(`Not Found: ${this.schemaName} ${this.name}`);
    }

    this._notInserted = false;
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

    this._links[fieldname] = await this.fyo.doc.getDoc(
      field.target,
      value as string
    );
  }

  getLink(fieldname: string): Doc | null {
    const link = this._links?.[fieldname];
    if (link === undefined) {
      return null;
    }

    return link;
  }

  _syncValues(data: DocValueMap) {
    this._clearValues();
    this._setValuesWithoutChecks(data);
    this._dirty = false;
    this.trigger('change', {
      doc: this,
    });
  }

  _clearValues() {
    for (const { fieldname } of this.schema.fields) {
      this[fieldname] = null;
    }

    this._dirty = true;
    this._notInserted = true;
  }

  _setChildIdx() {
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

  async _compareWithCurrentDoc() {
    if (this.notInserted || !this.name || this.schema.isSingle) {
      return;
    }

    const dbValues = await this.fyo.db.get(this.schemaName, this.name);
    const docModified = (this.modified as Date)?.toISOString();
    const dbModified = (dbValues.modified as Date)?.toISOString();

    if (dbValues && docModified !== dbModified) {
      throw new ConflictError(
        this.fyo
          .t`Document ${this.schemaName} ${this.name} has been modified after loading` +
          ` ${dbModified}, ${docModified}`
      );
    }

    if (this.submitted && !this.schema.isSubmittable) {
      throw new ValidationError(
        this.fyo.t`Document type ${this.schemaName} is not submittable`
      );
    }

    // set submit action flag
    if (this.submitted && !dbValues.submitted) {
      this.flags.submitAction = true;
    }

    if (dbValues.submitted && !this.submitted) {
      this.flags.revertAction = true;
    }
  }

  async _applyFormula(fieldname?: string) {
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

      changed ||= await this._applyFormulaForFields(
        formulaFields,
        row,
        fieldname
      );
    }

    // parent or child row
    const formulaFields = Object.keys(this.formulas).map(
      (fn) => this.fieldMap[fn]
    );
    changed ||= await this._applyFormulaForFields(
      formulaFields,
      doc,
      fieldname
    );
    return changed;
  }

  async _applyFormulaForFields(
    formulaFields: Field[],
    doc: Doc,
    fieldname?: string
  ) {
    let changed = false;
    for (const field of formulaFields) {
      const shouldApply = shouldApplyFormula(field, doc, fieldname);
      if (!shouldApply) {
        continue;
      }

      const newVal = await this._getValueFromFormula(field, doc);
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

  async _getValueFromFormula(field: Field, doc: Doc) {
    const formula = doc.formulas[field.fieldname];
    if (formula === undefined) {
      return;
    }

    let value: FormulaReturn;
    try {
      value = await formula();
    } catch {
      return;
    }
    if (Array.isArray(value) && field.fieldtype === FieldTypeEnum.Table) {
      value = value.map((row) => this._getChildDoc(row, field.fieldname));
    }

    return value;
  }

  async _commit() {
    // re-run triggers
    this._setChildIdx();
    await this._applyFormula();
    await this.trigger('validate', null);
  }

  async _insert() {
    await setName(this, this.fyo);
    this._setBaseMetaValues();
    await this._commit();
    await this._validateInsert();

    const oldName = this.name!;
    const validDict = this.getValidDict();
    const data = await this.fyo.db.insert(this.schemaName, validDict);
    this._syncValues(data);

    if (oldName !== this.name) {
      this.fyo.doc.removeFromCache(this.schemaName, oldName);
    }
    this.fyo.telemetry.log(Verb.Created, this.schemaName);
    return this;
  }

  async _update() {
    await this._compareWithCurrentDoc();
    await this._commit();

    // before submit
    if (this.flags.submitAction) await this.trigger('beforeSubmit');
    if (this.flags.revertAction) await this.trigger('beforeRevert');

    // update modifiedBy and modified
    this._updateModifiedMetaValues();

    const data = this.getValidDict();
    await this.fyo.db.update(this.schemaName, data);
    this._syncValues(data);

    // after submit
    if (this.flags.submitAction) await this.trigger('afterSubmit');
    if (this.flags.revertAction) await this.trigger('afterRevert');

    return this;
  }

  async sync() {
    await this.trigger('beforeSync');
    let doc;
    if (this.notInserted) {
      doc = await this._insert();
    } else {
      doc = await this._update();
    }
    this._notInserted = false;
    await this.trigger('afterSync');
    return doc;
  }

  async delete() {
    await this.trigger('beforeDelete');
    await this.fyo.db.delete(this.schemaName, this.name!);
    await this.trigger('afterDelete');

    this.fyo.telemetry.log(Verb.Deleted, this.schemaName);
  }

  async _submitOrRevert(isSubmit: boolean) {
    const wasSubmitted = this.submitted;
    this.submitted = isSubmit;
    try {
      await this.sync();
    } catch (e) {
      this.submitted = wasSubmitted;
      throw e;
    }
  }

  async submit() {
    this.cancelled = false;
    await this._submitOrRevert(true);
  }

  async revert() {
    await this._submitOrRevert(false);
  }

  async rename(newName: string) {
    await this.trigger('beforeRename');
    await this.fyo.db.rename(this.schemaName, this.name!, newName);
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
            return this.fyo.pesa(value as string | number);
          } catch (err) {
            (
              err as Error
            ).message += ` value: '${value}' of type: ${typeof value}, fieldname: '${tablefield}', childfield: '${childfield}'`;
            throw err;
          }
        }
        return value as Money;
      })
      .reduce((a, b) => a.add(b), this.fyo.pesa(0));

    if (convertToFloat) {
      return sum.float;
    }
    return sum;
  }

  getFrom(schemaName: string, name: string, fieldname: string) {
    if (name === undefined || fieldname === undefined) {
      return '';
    }

    return this.fyo.doc.getCachedValue(schemaName, name, fieldname);
  }

  async setAndSync(fieldname: string | DocValueMap, value?: DocValue | Doc[]) {
    await this.set(fieldname, value);
    return await this.sync();
  }

  async duplicate(shouldSync: boolean = true): Promise<Doc> {
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

    const doc = this.fyo.doc.getNewDoc(this.schemaName, {}, false);
    await doc.setMultiple(updateMap);

    if (shouldSync) {
      await doc.sync();
    }

    return doc;
  }

  async beforeSync() {}
  async afterSync() {}
  async beforeDelete() {}
  async afterDelete() {}
  async beforeSubmit() {}
  async afterSubmit() {}
  async beforeRevert() {}
  async afterRevert() {}

  formulas: FormulaMap = {};
  validations: ValidationMap = {};
  required: RequiredMap = {};
  hidden: HiddenMap = {};
  readOnly: ReadOnlyMap = {};
  dependsOn: DependsOnMap = {};
  getCurrencies: CurrenciesMap = {};

  static lists: ListsMap = {};
  static filters: FiltersMap = {};
  static defaults: DefaultMap = {};
  static emptyMessages: EmptyMessageMap = {};

  static getListViewSettings(fyo: Fyo): ListViewSettings {
    return {};
  }

  static getTreeSettings(fyo: Fyo): TreeViewSettings | void {}

  static getActions(fyo: Fyo): Action[] {
    return [];
  }
}
