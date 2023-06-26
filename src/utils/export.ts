import { Fyo } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import {
  Field,
  FieldType,
  FieldTypeEnum,
  RawValue,
  TargetField,
} from 'schemas/types';
import { generateCSV } from 'utils/csvParser';
import { GetAllOptions, QueryFilter } from 'utils/db/types';
import { getMapFromList, safeParseFloat } from 'utils/index';
import { ExportField, ExportTableField } from './types';

const excludedFieldTypes: FieldType[] = [
  FieldTypeEnum.AttachImage,
  FieldTypeEnum.Attachment,
];

interface CsvHeader {
  label: string;
  schemaName: string;
  fieldname: string;
  parentFieldname?: string;
}

export function getExportFields(
  fields: Field[],
  exclude: string[] = []
): ExportField[] {
  return fields
    .filter((f) => !f.computed && f.label && !exclude.includes(f.fieldname))
    .map((field) => {
      const { fieldname, label } = field;
      const fieldtype = field.fieldtype as FieldType;
      return {
        fieldname,
        fieldtype,
        label,
        export: !excludedFieldTypes.includes(fieldtype),
      };
    });
}

export function getExportTableFields(
  fields: Field[],
  fyo: Fyo
): ExportTableField[] {
  return fields
    .filter((f) => f.fieldtype === FieldTypeEnum.Table)
    .map((f) => {
      const target = (f as TargetField).target;
      const tableFields = fyo.schemaMap[target]?.fields ?? [];
      const exportTableFields = getExportFields(tableFields, ['name']);

      return {
        fieldname: f.fieldname,
        label: f.label,
        target,
        fields: exportTableFields,
      };
    })
    .filter((f) => !!f.fields.length);
}

export async function getJsonExportData(
  schemaName: string,
  fields: ExportField[],
  tableFields: ExportTableField[],
  limit: number | null,
  filters: QueryFilter,
  fyo: Fyo
): Promise<string> {
  const data = await getExportData(
    schemaName,
    fields,
    tableFields,
    limit,
    filters,
    fyo
  );
  convertParentDataToJsonExport(data.parentData, data.childTableData);
  return JSON.stringify(data.parentData);
}

export async function getCsvExportData(
  schemaName: string,
  fields: ExportField[],
  tableFields: ExportTableField[],
  limit: number | null,
  filters: QueryFilter,
  fyo: Fyo
): Promise<string> {
  const { childTableData, parentData } = await getExportData(
    schemaName,
    fields,
    tableFields,
    limit,
    filters,
    fyo
  );
  /**
   * parentNameMap: Record<ParentName, Record<ParentFieldName, Rows[]>>
   */
  const parentNameMap = getParentNameMap(childTableData);
  const headers = getCsvHeaders(schemaName, fields, tableFields);

  const rows: RawValue[][] = [];
  for (const parentRow of parentData) {
    const parentName = parentRow.name as string;
    if (!parentName) {
      continue;
    }

    const baseRowData = headers.parent.map(
      (f) => (parentRow[f.fieldname] as RawValue) ?? ''
    );

    const tableFieldRowMap = parentNameMap[parentName];
    if (!tableFieldRowMap || !Object.keys(tableFieldRowMap ?? {}).length) {
      rows.push([baseRowData, headers.child.map(() => '')].flat());
      continue;
    }

    for (const tableFieldName in tableFieldRowMap) {
      const tableRows = tableFieldRowMap[tableFieldName] ?? [];

      for (const tableRow of tableRows) {
        const tableRowData = headers.child.map((f) => {
          if (f.parentFieldname !== tableFieldName) {
            return '';
          }

          return (tableRow[f.fieldname] as RawValue) ?? '';
        });

        rows.push([baseRowData, tableRowData].flat());
      }
    }
  }

  const flatHeaders = [headers.parent, headers.child].flat();
  const labels = flatHeaders.map((f) => f.label);
  const keys = flatHeaders.map((f) => `${f.schemaName}.${f.fieldname}`);

  rows.unshift(keys);
  rows.unshift(labels);

  return generateCSV(rows);
}

function getCsvHeaders(
  schemaName: string,
  fields: ExportField[],
  tableFields: ExportTableField[]
) {
  const headers = {
    parent: [] as CsvHeader[],
    child: [] as CsvHeader[],
  };
  for (const { label, fieldname, fieldtype, export: shouldExport } of fields) {
    if (!shouldExport || fieldtype === FieldTypeEnum.Table) {
      continue;
    }

    headers.parent.push({ schemaName, label, fieldname });
  }

  for (const tf of tableFields) {
    if (!fields.find((f) => f.fieldname === tf.fieldname)?.export) {
      continue;
    }

    for (const field of tf.fields) {
      if (!field.export) {
        continue;
      }

      headers.child.push({
        schemaName: tf.target,
        label: field.label,
        fieldname: field.fieldname,
        parentFieldname: tf.fieldname,
      });
    }
  }

  return headers;
}

function getParentNameMap(childTableData: Record<string, RawValueMap[]>) {
  const parentNameMap: Record<string, Record<string, RawValueMap[]>> = {};
  for (const key in childTableData) {
    for (const row of childTableData[key]) {
      const parent = row.parent as string;
      if (!parent) {
        continue;
      }

      parentNameMap[parent] ??= {};
      parentNameMap[parent][key] ??= [];
      parentNameMap[parent][key].push(row);
    }
  }
  return parentNameMap;
}

async function getExportData(
  schemaName: string,
  fields: ExportField[],
  tableFields: ExportTableField[],
  limit: number | null,
  filters: QueryFilter,
  fyo: Fyo
) {
  const parentData = await getParentData(
    schemaName,
    filters,
    fields,
    limit,
    fyo
  );
  const parentNames = parentData.map((f) => f.name as string).filter(Boolean);
  const childTableData = await getAllChildTableData(
    tableFields,
    fields,
    parentNames,
    fyo
  );
  return { parentData, childTableData };
}

function convertParentDataToJsonExport(
  parentData: RawValueMap[],
  childTableData: Record<string, RawValueMap[]>
) {
  /**
   * Map from List does not create copies. Map is a
   * map of references, hence parentData is altered.
   */

  const nameMap = getMapFromList(parentData, 'name');
  for (const fieldname in childTableData) {
    const data = childTableData[fieldname];

    for (const row of data) {
      const parent = row.parent as string | undefined;
      if (!parent || !nameMap?.[parent]) {
        continue;
      }

      nameMap[parent][fieldname] ??= [];

      delete row.parent;
      delete row.name;

      (nameMap[parent][fieldname] as RawValueMap[]).push(row);
    }
  }
}

async function getParentData(
  schemaName: string,
  filters: QueryFilter,
  fields: ExportField[],
  limit: number | null,
  fyo: Fyo
) {
  const orderBy = ['created'];
  if (fyo.db.fieldMap[schemaName]['date']) {
    orderBy.unshift('date');
  }

  const options: GetAllOptions = { filters, orderBy, order: 'desc' };
  if (limit) {
    options.limit = limit;
  }

  options.fields = fields
    .filter((f) => f.export && f.fieldtype !== FieldTypeEnum.Table)
    .map((f) => f.fieldname);
  if (!options.fields.includes('name')) {
    options.fields.unshift('name');
  }
  const data = await fyo.db.getAllRaw(schemaName, options);
  convertRawPesaToFloat(data, fields);
  return data;
}

async function getAllChildTableData(
  tableFields: ExportTableField[],
  parentFields: ExportField[],
  parentNames: string[],
  fyo: Fyo
) {
  const childTables: Record<string, RawValueMap[]> = {};

  // Getting Child Row data
  for (const tf of tableFields) {
    const f = parentFields.find((f) => f.fieldname === tf.fieldname);
    if (!f?.export) {
      continue;
    }

    childTables[tf.fieldname] = await getChildTableData(tf, parentNames, fyo);
  }

  return childTables;
}

async function getChildTableData(
  exportTableField: ExportTableField,
  parentNames: string[],
  fyo: Fyo
) {
  const exportTableFields = exportTableField.fields
    .filter((f) => f.export && f.fieldtype !== FieldTypeEnum.Table)
    .map((f) => f.fieldname);
  if (!exportTableFields.includes('parent')) {
    exportTableFields.unshift('parent');
  }

  const data = await fyo.db.getAllRaw(exportTableField.target, {
    orderBy: 'idx',
    fields: exportTableFields,
    filters: { parent: ['in', parentNames] },
  });
  convertRawPesaToFloat(data, exportTableField.fields);
  return data;
}

function convertRawPesaToFloat(data: RawValueMap[], fields: ExportField[]) {
  const currencyFields = fields.filter(
    (f) => f.fieldtype === FieldTypeEnum.Currency
  );

  for (const row of data) {
    for (const { fieldname } of currencyFields) {
      row[fieldname] = safeParseFloat((row[fieldname] ?? '0') as string);
    }
  }
}
