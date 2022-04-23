import { Fyo } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { isPesa } from 'fyo/utils';
import { isEqual } from 'lodash';
import Money from 'pesa/dist/types/src/money';
import { Field, FieldType, FieldTypeEnum } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import Doc from './doc';

export function areDocValuesEqual(
  dvOne: DocValue | Doc[],
  dvTwo: DocValue | Doc[]
): boolean {
  if (['string', 'number'].includes(typeof dvOne) || dvOne instanceof Date) {
    return dvOne === dvTwo;
  }

  if (isPesa(dvOne)) {
    try {
      return (dvOne as Money).eq(dvTwo as string | number);
    } catch {
      return false;
    }
  }

  return isEqual(dvOne, dvTwo);
}

export function getPreDefaultValues(
  fieldtype: FieldType,
  fyo: Fyo
): DocValue | Doc[] {
  switch (fieldtype) {
    case FieldTypeEnum.Table:
      return [] as Doc[];
    case FieldTypeEnum.Currency:
      return fyo.pesa!(0.0);
    case FieldTypeEnum.Int:
    case FieldTypeEnum.Float:
      return 0;
    default:
      return null;
  }
}

export function getMissingMandatoryMessage(doc: Doc) {
  const mandatoryFields = getMandatory(doc);
  const message = mandatoryFields
    .filter((f) => {
      const value = doc.get(f.fieldname);
      const isNullOrUndef = getIsNullOrUndef(value);

      if (f.fieldtype === FieldTypeEnum.Table) {
        return isNullOrUndef || (value as Doc[])?.length === 0;
      }

      return isNullOrUndef || value === '';
    })
    .map((f) => f.label)
    .join(', ');

  if (message && doc.schema.isChild && doc.parentdoc && doc.parentfield) {
    const parentfield = doc.parentdoc.fieldMap[doc.parentfield];
    return `${parentfield.label} Row ${(doc.idx ?? 0) + 1}: ${message}`;
  }

  return message;
}

function getMandatory(doc: Doc): Field[] {
  const mandatoryFields: Field[] = [];
  for (const field of doc.schema.fields) {
    if (field.required) {
      mandatoryFields.push(field);
    }

    const requiredFunction = doc.required[field.fieldname];
    if (typeof requiredFunction !== 'function') {
      continue;
    }

    if (requiredFunction()) {
      mandatoryFields.push(field);
    }
  }

  return mandatoryFields;
}

export function shouldApplyFormula(field: Field, doc: Doc, fieldname?: string) {
  if (!doc.formulas[field.fieldname]) {
    return false;
  }

  if (field.readOnly) {
    return true;
  }

  const dependsOn = doc.dependsOn[field.fieldname] ?? [];
  if (fieldname && dependsOn.includes(fieldname)) {
    return true;
  }

  const value = doc.get(field.fieldname);
  return getIsNullOrUndef(value);
}
