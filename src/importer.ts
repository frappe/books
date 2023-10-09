import { Fyo } from 'fyo';
import { Converter } from 'fyo/core/converter';
import { DocValue, DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { getEmptyValuesByFieldTypes } from 'fyo/utils';
import { ValidationError } from 'fyo/utils/errors';
import {
  Field,
  FieldType,
  FieldTypeEnum,
  OptionField,
  RawValue,
  Schema,
  TargetField,
} from 'schemas/types';
import { generateCSV, parseCSV } from 'utils/csvParser';
import { getValueMapFromList } from 'utils/index';

export type TemplateField = Field & TemplateFieldProps;

type TemplateFieldProps = {
  schemaName: string;
  schemaLabel: string;
  fieldKey: string;
  parentSchemaChildField?: TargetField;
};

type ValueMatrixItem =
  | {
      value: DocValue;
      rawValue?: RawValue;
      error?: boolean;
    }
  | { value?: DocValue; rawValue: RawValue; error?: boolean };

type ValueMatrix = ValueMatrixItem[][];

const skippedFieldsTypes: FieldType[] = [
  FieldTypeEnum.AttachImage,
  FieldTypeEnum.Attachment,
  FieldTypeEnum.Table,
];

/**
 * Tool that
 * - Can make bulk entries for any kind of Doc
 * - Takes in unstructured CSV data, converts it into Docs
 * - Saves and or Submits the converted Docs
 */
export class Importer {
  schemaName: string;
  fyo: Fyo;

  /**
   * List of template fields that have been assigned a column, in
   * the order they have been assigned.
   */
  assignedTemplateFields: (string | null)[];

  /**
   * Map of all the template fields that can be imported.
   */
  templateFieldsMap: Map<string, TemplateField>;

  /**
   * Map of Fields that have been picked, i.e.
   * - Fields which will be included in the template
   * - Fields for which values will be provided
   */
  templateFieldsPicked: Map<string, boolean>;

  /**
   * Whether the schema type being imported has table fields
   */
  hasChildTables: boolean;

  /**
   * Matrix containing the raw values which will be converted to
   * doc values before importing.
   */
  valueMatrix: ValueMatrix;

  /**
   * Data from the valueMatrix rows will be converted into Docs
   * which will be stored in this array.
   */
  docs: Doc[];

  /**
   * Used if an options field is imported where the import data
   * provided maybe the label and not the value
   */
  optionsMap: {
    values: Record<string, Set<string>>;
    labelValueMap: Record<string, Record<string, string>>;
  };

  constructor(schemaName: string, fyo: Fyo) {
    if (!fyo.schemaMap[schemaName]) {
      throw new ValidationError(
        `Invalid schemaName ${schemaName} found in importer`
      );
    }

    this.hasChildTables = false;
    this.schemaName = schemaName;
    this.fyo = fyo;
    this.docs = [];
    this.valueMatrix = [];
    this.optionsMap = {
      values: {},
      labelValueMap: {},
    };

    const templateFields = getTemplateFields(schemaName, fyo, this);
    this.assignedTemplateFields = templateFields.map((f) => f.fieldKey);
    this.templateFieldsMap = new Map();
    this.templateFieldsPicked = new Map();

    templateFields.forEach((f) => {
      this.templateFieldsMap.set(f.fieldKey, f);
      this.templateFieldsPicked.set(f.fieldKey, true);
    });
  }

  selectFile(data: string): boolean {
    try {
      const parsed = parseCSV(data);
      this.selectParsed(parsed);
    } catch {
      return false;
    }

    return true;
  }

  async checkLinks() {
    const tfKeys = this.assignedTemplateFields
      .map((key, index) => ({
        key,
        index,
        tf: this.templateFieldsMap.get(key ?? ''),
      }))
      .filter(({ key, tf }) => {
        if (!key || !tf) {
          return false;
        }

        return tf.fieldtype === FieldTypeEnum.Link;
      }) as { key: string; index: number; tf: TemplateField }[];

    const linksNames: Map<string, Set<string>> = new Map();
    for (const row of this.valueMatrix) {
      for (const { tf, index } of tfKeys) {
        const target = (tf as TargetField).target;
        const value = row[index]?.value;
        if (typeof value !== 'string' || !value) {
          continue;
        }

        if (!linksNames.has(target)) {
          linksNames.set(target, new Set());
        }

        linksNames.get(target)?.add(value);
      }
    }

    const doesNotExist = [];
    for (const [target, values] of linksNames.entries()) {
      for (const value of values) {
        const exists = await this.fyo.db.exists(target, value);
        if (exists) {
          continue;
        }

        doesNotExist.push({
          schemaName: target,
          schemaLabel: this.fyo.schemaMap[this.schemaName]?.label,
          name: value,
        });
      }
    }

    return doesNotExist;
  }

  checkCellErrors() {
    const assigned = this.assignedTemplateFields
      .map((key, index) => ({
        key,
        index,
        tf: this.templateFieldsMap.get(key ?? ''),
      }))
      .filter(({ key, tf }) => !!key && !!tf) as {
      key: string;
      index: number;
      tf: TemplateField;
    }[];

    const cellErrors = [];
    for (let i = 0; i < this.valueMatrix.length; i++) {
      const row = this.valueMatrix[i];
      for (const { tf, index } of assigned) {
        if (!row[index]?.error) {
          continue;
        }

        const rowLabel = this.fyo.t`Row ${i + 1}`;
        const columnLabel = getColumnLabel(tf);
        cellErrors.push(`(${rowLabel}, ${columnLabel})`);
      }
    }

    return cellErrors;
  }

  populateDocs() {
    const { dataMap, childTableMap } =
      this.getDataAndChildTableMapFromValueMatrix();

    const schema = this.fyo.schemaMap[this.schemaName];
    const targetFieldnameMap = schema?.fields
      .filter((f) => f.fieldtype === FieldTypeEnum.Table)
      .reduce((acc, f) => {
        const { target, fieldname } = f as TargetField;
        acc[target] = fieldname;
        return acc;
      }, {} as Record<string, string>);

    for (const [name, data] of dataMap.entries()) {
      const doc = this.fyo.doc.getNewDoc(this.schemaName, data, false);
      for (const schemaName in targetFieldnameMap) {
        const fieldname = targetFieldnameMap[schemaName];
        const childTable = childTableMap[name]?.[schemaName];
        if (!childTable) {
          continue;
        }

        for (const childData of childTable.values()) {
          doc.push(fieldname, childData);
        }
      }

      this.docs.push(doc);
    }
  }

  getDataAndChildTableMapFromValueMatrix() {
    /**
     * Record key is the doc.name value
     */
    const dataMap: Map<string, DocValueMap> = new Map();

    /**
     * Record key is doc.name, childSchemaName, childDoc.name
     */
    const childTableMap: Record<
      string,
      Record<string, Map<string, DocValueMap>>
    > = {};

    const nameIndices = this.assignedTemplateFields
      .map((key, index) => ({ key, index }))
      .filter((f) => f.key?.endsWith('.name'))
      .reduce((acc, f) => {
        if (f.key == null) {
          return acc;
        }

        const schemaName = f.key.split('.')[0];
        acc[schemaName] = f.index;
        return acc;
      }, {} as Record<string, number>);

    const nameIndex = nameIndices?.[this.schemaName];
    if (nameIndex < 0) {
      return { dataMap, childTableMap };
    }

    for (let i = 0; i < this.valueMatrix.length; i++) {
      const row = this.valueMatrix[i];
      const name = row[nameIndex]?.value;
      if (typeof name !== 'string') {
        continue;
      }

      for (let j = 0; j < row.length; j++) {
        const key = this.assignedTemplateFields[j];
        const tf = this.templateFieldsMap.get(key ?? '');
        if (!tf || !key) {
          continue;
        }

        const isChild = this.fyo.schemaMap[tf.schemaName]?.isChild;
        const vmi = row[j];
        if (vmi.value == null) {
          continue;
        }

        if (!isChild && !dataMap.has(name)) {
          dataMap.set(name, {});
        }

        if (!isChild) {
          dataMap.get(name)![tf.fieldname] = vmi.value;
          continue;
        }

        const childNameIndex = nameIndices[tf.schemaName];
        let childName = row[childNameIndex]?.value;
        if (typeof childName !== 'string') {
          childName = `${tf.schemaName}-${i}`;
        }

        childTableMap[name] ??= {};
        childTableMap[name][tf.schemaName] ??= new Map();

        const childMap = childTableMap[name][tf.schemaName];
        if (!childMap.has(childName)) {
          childMap.set(childName, {});
        }

        const childDocValueMap = childMap.get(childName);
        if (!childDocValueMap) {
          continue;
        }

        childDocValueMap[tf.fieldname] = vmi.value;
      }
    }

    return { dataMap, childTableMap };
  }

  selectParsed(parsed: string[][]): void {
    if (!parsed?.length) {
      return;
    }

    let startIndex = -1;
    let templateFieldsAssigned;

    for (let i = 3; i >= 0; i--) {
      const row = parsed[i];
      if (!row?.length) {
        continue;
      }

      templateFieldsAssigned = this.assignTemplateFieldsFromParsedRow(row);
      if (templateFieldsAssigned) {
        startIndex = i + 1;
        break;
      }
    }

    if (!templateFieldsAssigned) {
      this.clearAndResizeAssignedTemplateFields(parsed[0].length);
    }

    if (startIndex === -1) {
      startIndex = 0;
    }

    this.assignValueMatrixFromParsed(parsed.slice(startIndex));
  }

  clearAndResizeAssignedTemplateFields(size: number) {
    for (let i = 0; i < size; i++) {
      if (i >= this.assignedTemplateFields.length) {
        this.assignedTemplateFields.push(null);
      } else {
        this.assignedTemplateFields[i] = null;
      }
    }
  }

  assignValueMatrixFromParsed(parsed: string[][]) {
    if (!parsed?.length) {
      return;
    }

    for (const row of parsed) {
      this.pushToValueMatrixFromParsedRow(row);
    }
  }

  pushToValueMatrixFromParsedRow(row: string[]) {
    const vmRow: ValueMatrix[number] = [];
    for (let i = 0; i < row.length; i++) {
      const rawValue = row[i];
      const index = Number(i);

      if (index >= this.assignedTemplateFields.length) {
        this.assignedTemplateFields.push(null);
      }

      vmRow.push(this.getValueMatrixItem(index, rawValue));
    }

    this.valueMatrix.push(vmRow);
  }

  setTemplateField(index: number, key: string | null) {
    if (index >= this.assignedTemplateFields.length) {
      this.assignedTemplateFields.push(key);
    } else {
      this.assignedTemplateFields[index] = key;
    }

    this.updateValueMatrixColumn(index);
  }

  updateValueMatrixColumn(index: number) {
    for (const row of this.valueMatrix) {
      const vmi = this.getValueMatrixItem(index, row[index].rawValue ?? null);

      if (index >= row.length) {
        row.push(vmi);
      } else {
        row[index] = vmi;
      }
    }
  }

  getValueMatrixItem(index: number, rawValue: RawValue) {
    const vmi: ValueMatrixItem = { rawValue };
    const key = this.assignedTemplateFields[index];
    if (!key) {
      return vmi;
    }

    const tf = this.templateFieldsMap.get(key);
    if (!tf) {
      return vmi;
    }

    if (vmi.rawValue === '') {
      vmi.value = null;
      return vmi;
    }

    if ('options' in tf && typeof vmi.rawValue === 'string') {
      return this.getOptionFieldVmi(vmi, tf);
    }

    try {
      vmi.value = Converter.toDocValue(rawValue, tf, this.fyo);
    } catch {
      vmi.error = true;
    }

    return vmi;
  }

  getOptionFieldVmi(
    { rawValue }: ValueMatrixItem,
    tf: OptionField & TemplateFieldProps
  ): ValueMatrixItem {
    if (typeof rawValue !== 'string') {
      return { error: true, value: null, rawValue };
    }

    if (!tf?.options.length) {
      return { value: null, rawValue };
    }

    if (!this.optionsMap.labelValueMap[tf.fieldKey]) {
      const values = new Set(tf.options.map(({ value }) => value));
      const labelValueMap = getValueMapFromList(tf.options, 'label', 'value');

      this.optionsMap.labelValueMap[tf.fieldKey] = labelValueMap;
      this.optionsMap.values[tf.fieldKey] = values;
    }

    const hasValue = this.optionsMap.values[tf.fieldKey].has(rawValue);
    if (hasValue) {
      return { value: rawValue, rawValue };
    }

    const value = this.optionsMap.labelValueMap[tf.fieldKey][rawValue];
    if (value) {
      return { value, rawValue };
    }

    return { error: true, value: null, rawValue };
  }

  assignTemplateFieldsFromParsedRow(row: string[]): boolean {
    const isKeyRow = row.some((key) => this.templateFieldsMap.has(key));
    if (!isKeyRow) {
      return false;
    }

    for (let i = 0; i < row.length; i++) {
      const value = row[i];
      const tf = this.templateFieldsMap.get(value);
      let key: string | null = value;

      if (!tf) {
        key = null;
      }

      if (key !== null && !this.templateFieldsPicked.get(value)) {
        key = null;
      }

      if (Number(i) >= this.assignedTemplateFields.length) {
        this.assignedTemplateFields.push(key);
      } else {
        this.assignedTemplateFields[i] = key;
      }
    }

    return true;
  }

  addRow() {
    const valueRow: ValueMatrix[number] = this.assignedTemplateFields.map(
      (key) => {
        key ??= '';
        const { fieldtype } = this.templateFieldsMap.get(key) ?? {};
        let value = null;
        if (fieldtype) {
          value = getEmptyValuesByFieldTypes(fieldtype, this.fyo);
        }

        return { value };
      }
    );

    this.valueMatrix.push(valueRow);
  }

  removeRow(index: number) {
    this.valueMatrix = this.valueMatrix.filter((_, i) => i !== index);
  }

  getCSVTemplate(): string {
    const schemaLabels: string[] = [];
    const fieldLabels: string[] = [];
    const fieldKey: string[] = [];

    for (const [name, picked] of this.templateFieldsPicked.entries()) {
      if (!picked) {
        continue;
      }

      const field = this.templateFieldsMap.get(name);
      if (!field) {
        continue;
      }

      schemaLabels.push(field.schemaLabel);
      fieldLabels.push(field.label);
      fieldKey.push(field.fieldKey);
    }

    return generateCSV([schemaLabels, fieldLabels, fieldKey]);
  }
}

function getTemplateFields(
  schemaName: string,
  fyo: Fyo,
  importer: Importer
): TemplateField[] {
  const schemas: { schema: Schema; parentSchemaChildField?: TargetField }[] = [
    { schema: fyo.schemaMap[schemaName]! },
  ];
  const fields: TemplateField[] = [];

  const targetSchemaFieldMap =
    fyo.schemaMap[importer.schemaName]?.fields.reduce((acc, f) => {
      if (!(f as TargetField).target) {
        return acc;
      }

      acc[f.fieldname] = f;
      return acc;
    }, {} as Record<string, Field>) ?? {};

  while (schemas.length) {
    const { schema, parentSchemaChildField } = schemas.pop() ?? {};
    if (!schema) {
      continue;
    }

    for (const field of schema.fields) {
      if (shouldSkipField(field, schema)) {
        continue;
      }

      if (field.fieldtype === FieldTypeEnum.Table) {
        importer.hasChildTables = true;
        schemas.push({
          schema: fyo.schemaMap[field.target]!,
          parentSchemaChildField: field,
        });
      }

      if (skippedFieldsTypes.includes(field.fieldtype)) {
        continue;
      }

      const tf = { ...field };

      if (tf.readOnly) {
        tf.readOnly = false;
      }

      if (schema.isChild && tf.fieldname === 'name') {
        tf.required = false;
      }

      if (
        schema.isChild &&
        tf.required &&
        !targetSchemaFieldMap[tf.schemaName ?? '']?.required
      ) {
        tf.required = false;
      }

      const schemaName = schema.name;
      const schemaLabel = schema.label;
      const fieldKey = `${schema.name}.${field.fieldname}`;

      fields.push({
        ...tf,
        schemaName,
        schemaLabel,
        fieldKey,
        parentSchemaChildField,
      });
    }
  }

  return fields;
}

export function getColumnLabel(field: TemplateField): string {
  if (field.parentSchemaChildField) {
    return `${field.label} (${field.parentSchemaChildField.label})`;
  }

  return field.label;
}

function shouldSkipField(field: Field, schema: Schema): boolean {
  if (field.computed || field.meta) {
    return true;
  }

  if (schema.naming === 'numberSeries' && field.fieldname === 'name') {
    return false;
  }

  if (field.hidden) {
    return true;
  }

  if (field.readOnly && !field.required) {
    return true;
  }

  return false;
}
