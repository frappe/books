/**
 * General purpose utils used by the frontend.
 */
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import {
  BaseError,
  DuplicateEntryError,
  LinkValidationError,
} from 'fyo/utils/errors';
import { Field, FieldType, FieldTypeEnum, NumberField } from 'schemas/types';
import { fyo } from 'src/initFyo';

export function stringifyCircular(
  obj: unknown,
  ignoreCircular = false,
  convertDocument = false
): string {
  const cacheKey: string[] = [];
  const cacheValue: unknown[] = [];

  return JSON.stringify(obj, (key: string, value: unknown) => {
    if (typeof value !== 'object' || value === null) {
      cacheKey.push(key);
      cacheValue.push(value);
      return value;
    }

    if (cacheValue.includes(value)) {
      const circularKey: string =
        cacheKey[cacheValue.indexOf(value)] || '{self}';
      return ignoreCircular ? undefined : `[Circular:${circularKey}]`;
    }

    cacheKey.push(key);
    cacheValue.push(value);

    if (convertDocument && value instanceof Doc) {
      return value.getValidDict();
    }

    return value;
  });
}

export function fuzzyMatch(input: string, target: string) {
  const keywordLetters = [...input];
  const candidateLetters = [...target];

  let keywordLetter = keywordLetters.shift();
  let candidateLetter = candidateLetters.shift();

  let isMatch = true;
  let distance = 0;

  while (keywordLetter && candidateLetter) {
    if (keywordLetter === candidateLetter) {
      keywordLetter = keywordLetters.shift();
    } else if (keywordLetter.toLowerCase() === candidateLetter.toLowerCase()) {
      keywordLetter = keywordLetters.shift();
      distance += 0.5;
    } else {
      distance += 1;
    }

    candidateLetter = candidateLetters.shift();
  }

  if (keywordLetter !== undefined) {
    distance = Number.MAX_SAFE_INTEGER;
    isMatch = false;
  } else {
    distance += candidateLetters.length;
  }

  return { isMatch, distance };
}

export function convertPesaValuesToFloat(obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (!isPesa(value)) {
      return;
    }

    obj[key] = value.float;
  });
}

export function getErrorMessage(e: Error, doc?: Doc): string {
  const errorMessage = e.message || t`An error occurred.`;

  let { schemaName, name } = doc ?? {};
  if (!doc) {
    schemaName = (e as BaseError).more?.schemaName as string | undefined;
    name = (e as BaseError).more?.value as string | undefined;
  }

  if (!schemaName || !name) {
    return errorMessage;
  }

  const label = fyo.db.schemaMap[schemaName]?.label ?? schemaName;
  if (e instanceof LinkValidationError) {
    return t`${label} ${name} is linked with existing records.`;
  } else if (e instanceof DuplicateEntryError) {
    return t`${label} ${name} already exists.`;
  }

  return errorMessage;
}

export function isNumeric(
  fieldtype: FieldType
): fieldtype is NumberField['fieldtype'];
export function isNumeric(fieldtype: Field): fieldtype is NumberField;
export function isNumeric(
  fieldtype: Field | FieldType
): fieldtype is NumberField | NumberField['fieldtype'] {
  if (typeof fieldtype !== 'string') {
    fieldtype = fieldtype?.fieldtype;
  }

  const numericTypes: FieldType[] = [
    FieldTypeEnum.Int,
    FieldTypeEnum.Float,
    FieldTypeEnum.Currency,
  ];

  return numericTypes.includes(fieldtype);
}
