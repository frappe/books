import { Fyo } from 'fyo';
import { Converter } from 'fyo/core/converter';
import { DocValue, DocValueMap, RawValueMap } from 'fyo/core/types';
import { Verb } from 'fyo/telemetry/types';
import { DEFAULT_USER } from 'fyo/utils/consts';
import { ConflictError, MandatoryError, NotFoundError } from 'fyo/utils/errors';
import Observable from 'fyo/utils/observable';
import {
  DynamicLinkField,
  Field,
  FieldTypeEnum,
  OptionField,
  RawValue,
  Schema,
  TargetField,
} from 'schemas/types';
import { getIsNullOrUndef, getMapFromList, getRandomString } from 'utils';
import { markRaw } from 'vue';
import { isPesa } from '../utils/index';
import { getDbSyncError } from './errorHelpers';
import {
  areDocValuesEqual,
  getMissingMandatoryMessage,
  getPreDefaultValues,
  setChildDocIdx,
  shouldApplyFormula,
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

  links?: Record<string, Doc>;
  _dirty: boolean = true;
  _notInserted: boolean = true;

  _syncing = false;
  constructor(
    schema: Schema,
    data: DocValueMap,
    fyo: Fyo,
    convertToDocValue: boolean = true
  ) {
    super();
    this.fyo = markRaw(fyo);
    this.schema = schema;
    this.fieldMap = getMapFromList(schema.fields, 'fieldname');

    if (this.schema.isSingle) {
      this.name = this.schemaName;
    }

    this._setDefaults();
    this._setValuesWithoutChecks(data, convertToDocValue);
  }

  get schemaName(): string {
    return this.schema.name;
  }

  get notInserted(): boolean {
    return this._notInserted;
  }

  get inserted(): boolean {
    return !this._notInserted;
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

  get isSyncing() {
    return this._syncing;
  }

  get canDelete() {
    if (this.notInserted) {
      return false;
    }

    if (this.schema.isSingle) {
      return false;
    }

    if (this.schema.isChild) {
      return false;
    }

    if (!this.schema.isSubmittable) {
      return true;
    }

    if (this.schema.isSubmittable && this.isCancelled) {
      return true;
    }

    if (this.schema.isSubmittable && !this.isSubmitted) {
      return true;
    }

    return false;
  }

  get canEdit() {
    if (!this.schema.isSubmittable) {
      return true;
    }

    if (this.submitted) {
      return false;
    }

    if (this.cancelled) {
      return false;
    }

    return true;
  }

  get canSave() {
    const isSubmittable = this.schema.isSubmittable;
    if (isSubmittable && !!this.submitted) {
      return false;
    }

    if (isSubmittable && !!this.cancelled) {
      return false;
    }

    if (!this.dirty) {
      return false;
    }

    if (this.schema.isChild) {
      return false;
    }

    return true;
  }

  get canSubmit() {
    if (!this.schema.isSubmittable) {
      return false;
    }

    if (this.dirty) {
      return false;
    }

    if (this.notInserted) {
      return false;
    }

    if (!!this.submitted) {
      return false;
    }

    if (!!this.cancelled) {
      return false;
    }

    return true;
  }

  get canCancel() {
    if (!this.schema.isSubmittable) {
      return false;
    }

    if (this.dirty) {
      return false;
    }

    if (this.notInserted) {
      return false;
    }

    if (!!this.cancelled) {
      return false;
    }

    if (!this.submitted) {
      return false;
    }

    return true;
  }

  _setValuesWithoutChecks(data: DocValueMap, convertToDocValue: boolean) {
    for (const field of this.schema.fields) {
      const { fieldname, fieldtype } = field;
      const value = data[field.fieldname];

      if (Array.isArray(value)) {
        for (const row of value) {
          this.push(fieldname, row, convertToDocValue);
        }
      } else if (
        fieldtype === FieldTypeEnum.Currency &&
        typeof value === 'number'
      ) {
        this[fieldname] = this.fyo.pesa(value);
      } else if (value !== undefined && !convertToDocValue) {
        this[fieldname] = value;
      } else if (value !== undefined) {
        this[fieldname] = Converter.toDocValue(
          value as RawValue,
          field,
          this.fyo
        );
      } else {
        this[fieldname] = this[fieldname] ?? null;
      }

      if (field.fieldtype === FieldTypeEnum.Table && !this[fieldname]) {
        this[fieldname] = [];
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
    value?: DocValue | Doc[] | DocValueMap[],
    retriggerChildDocApplyChange: boolean = false
  ): Promise<boolean> {
    if (typeof fieldname === 'object') {
      return await this.setMultiple(fieldname as DocValueMap);
    }

    if (!this._canSet(fieldname, value)) {
      return false;
    }

    this._setDirty(true);
    if (typeof value === 'string') {
      value = value.trim();
    }

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
      await this._applyChange(fieldname, retriggerChildDocApplyChange);
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

  async _applyChange(
    changedFieldname: string,
    retriggerChildDocApplyChange?: boolean
  ): Promise<boolean> {
    await this._applyFormula(changedFieldname, retriggerChildDocApplyChange);
    await this.trigger('change', {
      doc: this,
      changed: changedFieldname,
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
        defaultValue = defaultFunction(this);
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

  push(
    fieldname: string,
    docValueMap: Doc | DocValueMap | RawValueMap = {},
    convertToDocValue: boolean = false
  ) {
    const childDocs = [
      (this[fieldname] ?? []) as Doc[],
      this._getChildDoc(docValueMap, fieldname, convertToDocValue),
    ].flat();

    setChildDocIdx(childDocs);
    this[fieldname] = childDocs;
  }

  _setChildDocsParent() {
    for (const { fieldname } of this.tableFields) {
      const value = this.get(fieldname);
      if (!Array.isArray(value)) {
        continue;
      }

      for (const childDoc of value) {
        if (childDoc.parent) {
          continue;
        }

        childDoc.parent = this.name;
      }
    }
  }

  _getChildDoc(
    docValueMap: Doc | DocValueMap | RawValueMap,
    fieldname: string,
    convertToDocValue: boolean = false
  ): Doc {
    if (!this.name && this.schema.naming !== 'manual') {
      this.name = this.fyo.doc.getTemporaryName(this.schema);
    }

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
      false,
      undefined,
      undefined,
      convertToDocValue
    );
    childDoc.parentdoc = this;
    return childDoc;
  }

  async _validateSync() {
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
      if (!childDocs) {
        continue;
      }

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

  getValidDict(
    filterMeta: boolean = false,
    filterComputed: boolean = false
  ): DocValueMap {
    let fields = this.schema.fields;
    if (filterMeta) {
      fields = this.schema.fields.filter((f) => !f.meta);
    }

    if (filterComputed) {
      fields = fields.filter((f) => !f.computed);
    }

    const data: DocValueMap = {};
    for (const field of fields) {
      let value = this[field.fieldname] as DocValue | DocValueMap[];

      if (Array.isArray(value)) {
        value = value.map((doc) =>
          (doc as Doc).getValidDict(filterMeta, filterComputed)
        );
      }

      if (isPesa(value)) {
        value = value.copy();
      }

      if (value === null && this.schema.isSingle) {
        continue;
      }

      data[field.fieldname] = value;
    }
    return data;
  }

  _setBaseMetaValues() {
    if (this.schema.isSubmittable) {
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
      await this._syncValues(data);
      await this.loadLinks();
    } else {
      throw new NotFoundError(`Not Found: ${this.schemaName} ${this.name}`);
    }

    this._setDirty(false);
    this._notInserted = false;
    this.fyo.doc.observer.trigger(`load:${this.schemaName}`, this.name);
  }

  async loadLinks() {
    this.links ??= {};
    const linkFields = this.schema.fields.filter(
      ({ fieldtype }) =>
        fieldtype === FieldTypeEnum.Link ||
        fieldtype === FieldTypeEnum.DynamicLink
    );

    for (const field of linkFields) {
      await this._loadLink(field);
    }
  }

  async _loadLink(field: Field) {
    if (field.fieldtype === FieldTypeEnum.Link) {
      return await this._loadLinkField(field as TargetField);
    }

    if (field.fieldtype === FieldTypeEnum.DynamicLink) {
      return await this._loadDynamicLinkField(field as DynamicLinkField);
    }
  }

  async _loadLinkField(field: TargetField) {
    const { fieldname, target } = field;
    const value = this.get(fieldname) as string | undefined;
    if (!value || !target) {
      return;
    }

    await this._loadLinkDoc(fieldname, target, value);
  }

  async _loadDynamicLinkField(field: DynamicLinkField) {
    const { fieldname, references } = field;
    const value = this.get(fieldname) as string | undefined;
    const reference = this.get(references) as string | undefined;
    if (!value || !reference) {
      return;
    }

    await this._loadLinkDoc(fieldname, reference, value);
  }

  async _loadLinkDoc(fieldname: string, schemaName: string, name: string) {
    this.links![fieldname] = await this.fyo.doc.getDoc(schemaName, name);
  }

  getLink(fieldname: string): Doc | null {
    return this.links?.[fieldname] ?? null;
  }

  async loadAndGetLink(fieldname: string): Promise<Doc | null> {
    if (!this?.[fieldname]) {
      return null;
    }

    if (this.links?.[fieldname]?.name !== this[fieldname]) {
      await this.loadLinks();
    }

    return this.links?.[fieldname] ?? null;
  }

  async _syncValues(data: DocValueMap) {
    this._clearValues();
    this._setValuesWithoutChecks(data, false);
    await this._setComputedValuesFromFormulas();
    this._dirty = false;
    this.trigger('change', {
      doc: this,
    });
  }

  async _setComputedValuesFromFormulas() {
    for (const field of this.schema.fields) {
      await this._setComputedValuesForChildren(field);
      if (!field.computed) {
        continue;
      }

      const value = await this._getValueFromFormula(field, this);
      this[field.fieldname] = value ?? null;
    }
  }

  async _setComputedValuesForChildren(field: Field) {
    if (field.fieldtype !== 'Table') {
      return;
    }

    const childDocs: Doc[] = (this[field.fieldname] as Doc[]) ?? [];
    for (const doc of childDocs) {
      await doc._setComputedValuesFromFormulas();
    }
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
          .t`${this.schema.label} ${this.name} has been modified after loading` +
          ` ${dbModified}, ${docModified}`
      );
    }
  }

  async runFormulas() {
    await this._applyFormula();
  }

  async _applyFormula(
    changedFieldname?: string,
    retriggerChildDocApplyChange?: boolean
  ): Promise<boolean> {
    const doc = this;
    let changed = await this._callAllTableFieldsApplyFormula(changedFieldname);
    changed =
      (await this._applyFormulaForFields(doc, changedFieldname)) || changed;

    if (changed && retriggerChildDocApplyChange) {
      await this._callAllTableFieldsApplyFormula(changedFieldname);
      await this._applyFormulaForFields(doc, changedFieldname);
    }

    return changed;
  }

  async _callAllTableFieldsApplyFormula(
    changedFieldname?: string
  ): Promise<boolean> {
    let changed = false;

    for (const { fieldname } of this.tableFields) {
      const childDocs = this.get(fieldname) as Doc[];
      if (!childDocs) {
        continue;
      }

      changed =
        (await this._callChildDocApplyFormula(childDocs, changedFieldname)) ||
        changed;
    }

    return changed;
  }

  async _callChildDocApplyFormula(
    childDocs: Doc[],
    fieldname?: string
  ): Promise<boolean> {
    let changed: boolean = false;
    for (const childDoc of childDocs) {
      if (!childDoc._applyFormula) {
        continue;
      }

      changed = (await childDoc._applyFormula(fieldname)) || changed;
    }

    return changed;
  }

  async _applyFormulaForFields(doc: Doc, fieldname?: string) {
    const formulaFields = this.schema.fields.filter(
      ({ fieldname }) => this.formulas?.[fieldname]
    );

    let changed = false;
    for (const field of formulaFields) {
      const shouldApply = shouldApplyFormula(field, doc, fieldname);
      if (!shouldApply) {
        continue;
      }

      const newVal = await this._getValueFromFormula(field, doc, fieldname);
      const previousVal = doc.get(field.fieldname);
      const isSame = areDocValuesEqual(newVal as DocValue, previousVal);
      if (newVal === undefined || isSame) {
        continue;
      }

      doc[field.fieldname] = newVal;
      changed ||= true;
    }

    return changed;
  }

  async _getValueFromFormula(field: Field, doc: Doc, fieldname?: string) {
    const { formula } = doc.formulas[field.fieldname] ?? {};
    if (formula === undefined) {
      return;
    }

    let value: FormulaReturn;
    try {
      value = await formula(fieldname);
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
    this._setChildDocsParent();
    await this._applyFormula();
    await this._validateSync();
    await this.trigger('validate');
  }

  async _insert() {
    this._setBaseMetaValues();
    await this._preSync();
    await setName(this, this.fyo);

    const validDict = this.getValidDict(false, true);
    let data: DocValueMap;
    try {
      data = await this.fyo.db.insert(this.schemaName, validDict);
    } catch (err) {
      throw await getDbSyncError(err as Error, this, this.fyo);
    }
    await this._syncValues(data);

    this.fyo.telemetry.log(Verb.Created, this.schemaName);
    return this;
  }

  async _update() {
    await this._validateDbNotModified();
    this._updateModifiedMetaValues();
    await this._preSync();

    const data = this.getValidDict(false, true);
    try {
      await this.fyo.db.update(this.schemaName, data);
    } catch (err) {
      throw await getDbSyncError(err as Error, this, this.fyo);
    }
    await this._syncValues(data);

    return this;
  }

  async sync(): Promise<Doc> {
    this._syncing = true;
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
    this._syncing = false;
    return doc;
  }

  async delete() {
    if (this.notInserted && this.name) {
      this.fyo.doc.removeFromCache(this.schemaName, this.name);
    }

    if (!this.canDelete) {
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

    this.fyo.telemetry.log(Verb.Submitted, this.schemaName);
    this.fyo.doc.observer.trigger(`submit:${this.schemaName}`, this.name);
  }

  async cancel() {
    if (!this.schema.isSubmittable || !this.submitted || this.cancelled) {
      return;
    }

    await this.trigger('beforeCancel');
    await this.trigger('beforeCancel');
    await this.setAndSync('cancelled', true);
    await this.trigger('afterCancel');

    this.fyo.telemetry.log(Verb.Cancelled, this.schemaName);
    this.fyo.doc.observer.trigger(`cancel:${this.schemaName}`, this.name);
  }

  async rename(newName: string) {
    if (this.submitted) {
      return;
    }

    const oldName = this.name;
    await this.trigger('beforeRename', { oldName, newName });
    await this.fyo.db.rename(this.schemaName, this.name!, newName);
    this.name = newName;
    await this.trigger('afterRename', { oldName, newName });
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

        return value;
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

  duplicate(): Doc {
    const updateMap = this.getValidDict(true, true);
    for (const field in updateMap) {
      const value = updateMap[field];
      if (!Array.isArray(value)) {
        continue;
      }

      for (const row of value) {
        delete row.name;
      }
    }

    if (this.numberSeries) {
      delete updateMap.name;
    } else {
      updateMap.name = updateMap.name + ' CPY';
    }

    const rawUpdateMap = this.fyo.db.converter.toRawValueMap(
      this.schemaName,
      updateMap
    ) as RawValueMap;

    return this.fyo.doc.getNewDoc(this.schemaName, rawUpdateMap, true);
  }

  /**
   * Lifecycle Methods
   *
   * Abstractish methods that are called using `this.trigger`.
   * These are to be overridden if required when subclassing.
   *
   * Refrain from running methods that call `this.sync`
   * in the `beforeLifecycle` methods.
   *
   * This may cause the lifecycle function to execute incorrectly.
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
  static createFilters: FiltersMap = {}; // Used by the *Create* dropdown option
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
