import { Fyo } from 'fyo';
import { Converter } from 'fyo/core/converter';
import { DocValue } from 'fyo/core/types';
import { getEmptyValuesByFieldTypes } from 'fyo/utils';
import { ValidationError } from 'fyo/utils/errors';
import {
  Field,
  FieldType,
  FieldTypeEnum,
  RawValue,
  Schema,
  TargetField,
} from 'schemas/types';
import { generateCSV, parseCSV } from 'utils/csvParser';

export type TemplateField = Field & {
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

  constructor(schemaName: string, fyo: Fyo) {
    if (!fyo.schemaMap[schemaName]) {
      throw new ValidationError(
        `Invalid schemaName ${schemaName} found in importer`
      );
    }

    this.hasChildTables = false;
    this.schemaName = schemaName;
    this.fyo = fyo;
    this.valueMatrix = [];

    const templateFields = getTemplateFields(schemaName, fyo, this);
    this.assignedTemplateFields = templateFields.map((f) => f.fieldKey);
    this.templateFieldsMap = new Map();
    this.templateFieldsPicked = new Map();

    templateFields.forEach((f, i) => {
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
    for (const i in row) {
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

    try {
      vmi.value = Converter.toDocValue(rawValue, tf, this.fyo);
    } catch {
      vmi.error = true;
    }

    return vmi;
  }

  assignTemplateFieldsFromParsedRow(row: string[]): boolean {
    const isKeyRow = row.some((key) => this.templateFieldsMap.has(key));
    if (!isKeyRow) {
      return false;
    }

    for (const i in row) {
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

  while (schemas.length) {
    const { schema, parentSchemaChildField } = schemas.pop() ?? {};
    if (!schema) {
      continue;
    }

    for (const field of schema.fields) {
      if (field.computed || field.meta || field.hidden) {
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

      if (field.readOnly && field.required) {
        field.readOnly = false;
      }

      if (field.readOnly) {
        continue;
      }

      const schemaName = schema.name;
      const schemaLabel = schema.label;
      const fieldKey = `${schema.name}.${field.fieldname}`;

      fields.push({
        ...field,
        schemaName,
        schemaLabel,
        fieldKey,
        parentSchemaChildField,
      });
    }
  }

  return fields;
}
