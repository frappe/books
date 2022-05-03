import { Fyo } from 'fyo';
import { DocValue, DocValueMap } from 'fyo/core/types';
import { Verb } from 'fyo/telemetry/types';
import { DEFAULT_USER } from 'fyo/utils/consts';
import { ConflictError, MandatoryError, NotFoundError } from 'fyo/utils/errors';
import Observable from 'fyo/utils/observable';
import Money from 'pesa/dist/types/src/money';
import {
  Field,
  FieldTypeEnum,
  OptionField,
  Schema,
  TargetField
} from 'schemas/types';
import { getIsNullOrUndef, getMapFromList, getRandomString } from 'utils';
import { markRaw } from 'vue';
import { isPesa } from '../utils/index';
import {
  areDocValuesEqual,
  getMissingMandatoryMessage,
  getPreDefaultValues,
  setChildDocIdx,
  shouldApplyFormula
} from './helpers';
import { setName } from './naming';
import {
  Action,
  ChangeArg,
  CurrenciesMap,
  DefaultMap,
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
import { validateOptions, validateRequired } from './validationFunction';

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

  get isSubmitted() {
    return !!this.submitted && !this.cancelled;
  }

  get isCancelled() {
    return !!this.submitted && !!this.cancelled;
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
  async set(
    fieldname: string | DocValueMap,
    value?: DocValue | Doc[] | DocValueMap[]
  ): Promise<boolean> {
    if (typeof fieldname === 'object') {
      return await this.setMultiple(fieldname as DocValueMap);
    }

    if (!this._canSet(fieldname, value)) {
      return false;
    }

    this._setDirty(true);
    if (Array.isArray(value)) {
      for (const row of value) {
        this.push(fieldname, row);
      }
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

    return true;
  }

  async setMultiple(docValueMap: DocValueMap): Promise<boolean> {
    let hasSet = false;
    for (const fieldname in docValueMap) {
      const isSet = await this.set(
        fieldname,
        docValueMap[fieldname] as DocValue | Doc[]
      );
      hasSet ||= isSet;
    }

    return hasSet;
  }

  _canSet(
    fieldname: string,
    value?: DocValue | Doc[] | DocValueMap[]
  ): boolean {
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

  async _applyChange(fieldname: string): Promise<boolean> {
    await this._applyFormula(fieldname);
    await this.trigger('change', {
      doc: this,
      changed: fieldname,
    });

    return true;
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
  async remove(fieldname: string, idx: number) {
    const childDocs = ((this[fieldname] ?? []) as Doc[]).filter(
      (row, i) => row.idx !== idx || i !== idx
    );

    setChildDocIdx(childDocs);
    this[fieldname] = childDocs;
    this._setDirty(true);
    return await this._applyChange(fieldname);
  }

  async append(fieldname: string, docValueMap: DocValueMap = {}) {
    this.push(fieldname, docValueMap);
    this._setDirty(true);
    return await this._applyChange(fieldname);
  }

  push(fieldname: string, docValueMap: Doc | DocValueMap = {}) {
    const childDocs = [
      (this[fieldname] ?? []) as Doc[],
      this._getChildDoc(docValueMap, fieldname),
    ].flat();

    setChildDocIdx(childDocs);
    this[fieldname] = childDocs;
  }

  _getChildDoc(docValueMap: Doc | DocValueMap, fieldname: string): Doc {
    docValueMap.name ??= getRandomString();

    // Child Meta Fields
    docValueMap.parent ??= this.name;
    docValueMap.parentSchemaName ??= this.schemaName;
    docValueMap.parentFieldname ??= fieldname;

    if (docValueMap instanceof Doc) {
      docValueMap.parentdoc ??= this;
      return docValueMap;
    }

    const childSchemaName = (this.fieldMap[fieldname] as TargetField).target;
    const childDoc = this.fyo.doc.getNewDoc(
      childSchemaName,
      docValueMap,
      false
    );
    childDoc.parentdoc = this;
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
    if (
      field.fieldtype === FieldTypeEnum.Select ||
      field.fieldtype === FieldTypeEnum.AutoComplete
    ) {
      validateOptions(field as OptionField, value as string, this);
    }

    validateRequired(field, value, this);
    if (getIsNullOrUndef(value)) {
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

    this._setDirty(false);
    this._notInserted = false;
    this.fyo.doc.observer.trigger(`load:${this.schemaName}`, this.name);
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

  _setChildDocsIdx() {
    const childFields = this.schema.fields.filter(
      (f) => f.fieldtype === FieldTypeEnum.Table
    ) as TargetField[];

    for (const field of childFields) {
      const childDocs = (this.get(field.fieldname) as Doc[]) ?? [];
      setChildDocIdx(childDocs);
    }
  }

  async _validateDbNotModified() {
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
  }

  async _applyFormula(fieldname?: string): Promise<boolean> {
    const doc = this;
    let changed = false;

    const childDocs = this.tableFields
      .map((f) => (this.get(f.fieldname) as Doc[]) ?? [])
      .flat();

    // children
    for (const row of childDocs) {
      changed ||= (await row?._applyFormula()) ?? false;
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
    const { formula } = doc.formulas[field.fieldname] ?? {};
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

  async _preSync() {
    this._setChildDocsIdx();
    await this._applyFormula();
    await this.trigger('validate');
  }

  async _insert() {
    await setName(this, this.fyo);
    this._setBaseMetaValues();
    await this._preSync();
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
    await this._validateDbNotModified();
    await this._preSync();
    this._updateModifiedMetaValues();

    const data = this.getValidDict();
    await this.fyo.db.update(this.schemaName, data);
    this._syncValues(data);

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
    this.fyo.doc.observer.trigger(`sync:${this.schemaName}`, this.name);
    return doc;
  }

  async delete() {
    if (this.schema.isSubmittable && !this.isCancelled) {
      return;
    }

    await this.trigger('beforeDelete');
    await this.fyo.db.delete(this.schemaName, this.name!);
    await this.trigger('afterDelete');

    this.fyo.telemetry.log(Verb.Deleted, this.schemaName);
    this.fyo.doc.observer.trigger(`delete:${this.schemaName}`, this.name);
  }

  async submit() {
    if (!this.schema.isSubmittable || this.submitted || this.cancelled) {
      return;
    }

    await this.trigger('beforeSubmit');
    await this.setAndSync('submitted', true);
    await this.trigger('afterSubmit');

    this.fyo.doc.observer.trigger(`submit:${this.schemaName}`, this.name);
  }

  async cancel() {
    if (!this.schema.isSubmittable || !this.submitted || this.cancelled) {
      return;
    }

    await this.trigger('beforeCancel');
    await this.setAndSync('cancelled', true);
    await this.trigger('afterCancel');

    this.fyo.doc.observer.trigger(`cancel:${this.schemaName}`, this.name);
  }

  async rename(newName: string) {
    if (this.submitted) {
      return;
    }

    await this.trigger('beforeRename');
    await this.fyo.db.rename(this.schemaName, this.name!, newName);
    this.name = newName;
    await this.trigger('afterRename');
    this.fyo.doc.observer.trigger(`rename:${this.schemaName}`, this.name);
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

    const doc = this.fyo.doc.getNewDoc(this.schemaName, updateMap, false);
    if (shouldSync) {
      await doc.sync();
    }

    return doc;
  }

  /**
   * Lifecycle Methods
   *
   * Abstractish methods that are called using `this.trigger`.
   * These are to be overridden if required when subclassing.
   */
  async change(ch: ChangeArg) {}
  async validate() {}
  async beforeSync() {}
  async afterSync() {}
  async beforeSubmit() {}
  async afterSubmit() {}
  async beforeRename() {}
  async afterRename() {}
  async beforeCancel() {}
  async afterCancel() {}
  async beforeDelete() {}
  async afterDelete() {}

  formulas: FormulaMap = {};
  validations: ValidationMap = {};
  required: RequiredMap = {};
  hidden: HiddenMap = {};
  readOnly: ReadOnlyMap = {};
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
