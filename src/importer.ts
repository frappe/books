import { Fyo } from 'fyo';
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

type ValueMatrix = {
  value: DocValue;
  rawValue?: RawValue;
  error?: boolean;
}[][];

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
    } catch {
      return false;
    }

    return true;
  }

  // createValueMatrixFromParsedCSV() {}

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
