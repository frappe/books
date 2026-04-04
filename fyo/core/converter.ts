import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import { ValueError } from 'fyo/utils/errors';
import { DateTime } from 'luxon';
import { Field, FieldTypeEnum, RawValue, TargetField } from 'schemas/types';
import { getIsNullOrUndef, safeParseFloat, safeParseInt } from 'utils';
import { DatabaseHandler } from './dbHandler';
import { Attachment, DocValue, DocValueMap, RawValueMap } from './types';

/**
 * # Converter
 *
 * Basically converts serializable RawValues from the db to DocValues used
 * by the frontend and vice versa.
 *
 * ## Value Conversion
 * It exposes two static methods: `toRawValue` and `toDocValue` that can be
 * used elsewhere given the fieldtype.
 *
 * ## Map Conversion
 * Two methods `toDocValueMap` and `toRawValueMap` are exposed but should be
 * used only from the `dbHandler`.
 */

export class Converter {
  db: DatabaseHandler;
  fyo: Fyo;

  constructor(db: DatabaseHandler, fyo: Fyo) {
    this.db = db;
    this.fyo = fyo;
  }

  toDocValueMap(
    schemaName: string,
    rawValueMap: RawValueMap | RawValueMap[]
  ): DocValueMap | DocValueMap[] {
    rawValueMap ??= {};
    if (Array.isArray(rawValueMap)) {
      return rawValueMap.map((dv) => this.#toDocValueMap(schemaName, dv));
    } else {
      return this.#toDocValueMap(schemaName, rawValueMap);
    }
  }

  toRawValueMap(
    schemaName: string,
    docValueMap: DocValueMap | DocValueMap[]
  ): RawValueMap | RawValueMap[] {
    docValueMap ??= {};
    if (Array.isArray(docValueMap)) {
      return docValueMap.map((dv) => this.#toRawValueMap(schemaName, dv));
    } else {
      return this.#toRawValueMap(schemaName, docValueMap);
    }
  }

  static toDocValue(value: RawValue, field: Field, fyo: Fyo): DocValue {
    switch (field.fieldtype) {
      case FieldTypeEnum.Currency:
        return toDocCurrency(value, field, fyo);
      case FieldTypeEnum.Date:
        return toDocDate(value, field);
      case FieldTypeEnum.Datetime:
        return toDocDate(value, field);
      case FieldTypeEnum.Int:
        return toDocInt(value, field);
      case FieldTypeEnum.Float:
        return toDocFloat(value, field);
      case FieldTypeEnum.Check:
        return toDocCheck(value, field);
      case FieldTypeEnum.Attachment:
        return toDocAttachment(value, field);
      default:
        return toDocString(value, field);
    }
  }

  static toRawValue(value: DocValue, field: Field, fyo: Fyo): RawValue {
    switch (field.fieldtype) {
      case FieldTypeEnum.Currency:
        return toRawCurrency(value, fyo, field);
      case FieldTypeEnum.Date:
        return toRawDate(value, field);
      case FieldTypeEnum.Datetime:
        return toRawDateTime(value, field);
      case FieldTypeEnum.Int:
        return toRawInt(value, field);
      case FieldTypeEnum.Float:
        return toRawFloat(value, field);
      case FieldTypeEnum.Check:
        return toRawCheck(value, field);
      case FieldTypeEnum.Link:
        return toRawLink(value, field);
      case FieldTypeEnum.Attachment:
        return toRawAttachment(value, field);
      default:
        return toRawString(value, field);
    }
  }

  #toDocValueMap(schemaName: string, rawValueMap: RawValueMap): DocValueMap {
    const fieldValueMap = this.db.fieldMap[schemaName];
    const docValueMap: DocValueMap = {};

    for (const fieldname in rawValueMap) {
      const field = fieldValueMap[fieldname];
      const rawValue = rawValueMap[fieldname];
      if (!field) {
        continue;
      }

      if (Array.isArray(rawValue)) {
        const parentSchemaName = (field as TargetField).target;
        docValueMap[fieldname] = rawValue.map((rv) =>
          this.#toDocValueMap(parentSchemaName, rv)
        );
      } else {
        docValueMap[fieldname] = Converter.toDocValue(
          rawValue,
          field,
          this.fyo
        );
      }
    }

    return docValueMap;
  }

  #toRawValueMap(schemaName: string, docValueMap: DocValueMap): RawValueMap {
    const fieldValueMap = this.db.fieldMap[schemaName];
    const rawValueMap: RawValueMap = {};

    for (const fieldname in docValueMap) {
      const field = fieldValueMap[fieldname];
      const docValue = docValueMap[fieldname];

      if (Array.isArray(docValue)) {
        const parentSchemaName = (field as TargetField).target;

        rawValueMap[fieldname] = docValue.map((value) => {
          if (value instanceof Doc) {
            return this.#toRawValueMap(parentSchemaName, value.getValidDict());
          }

          return this.#toRawValueMap(parentSchemaName, value);
        });
      } else {
        rawValueMap[fieldname] = Converter.toRawValue(
          docValue,
          field,
          this.fyo
        );
      }
    }

    return rawValueMap;
  }
}

function toDocString(value: RawValue, field: Field) {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  throwError(value, field, 'doc');
}

function toDocDate(value: RawValue, field: Field) {
  if ((value as unknown) instanceof Date) {
    return value;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throwError(value, field, 'doc');
  }

  const date = DateTime.fromISO(value).toJSDate();
  if (date.toString() === 'Invalid Date') {
    throwError(value, field, 'doc');
  }

  return date;
}

function toDocCurrency(value: RawValue, field: Field, fyo: Fyo) {
  if (isPesa(value)) {
    return value;
  }

  if (value === '') {
    return fyo.pesa(0);
  }

  if (typeof value === 'string') {
    return fyo.pesa(value);
  }

  if (typeof value === 'number') {
    return fyo.pesa(value);
  }

  if (typeof value === 'boolean') {
    return fyo.pesa(Number(value));
  }

  if (value === null) {
    return fyo.pesa(0);
  }

  throwError(value, field, 'doc');
}

function toDocInt(value: RawValue, field: Field): number {
  if (value === '') {
    return 0;
  }

  if (typeof value === 'string') {
    value = safeParseInt(value);
  }

  return toDocFloat(value, field);
}

function toDocFloat(value: RawValue, field: Field): number {
  if (value === '') {
    return 0;
  }

  if (typeof value === 'boolean') {
    return Number(value);
  }

  if (typeof value === 'string') {
    value = safeParseFloat(value);
  }

  if (value === null) {
    value = 0;
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  throwError(value, field, 'doc');
}

function toDocCheck(value: RawValue, field: Field): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return !!safeParseFloat(value);
  }

  if (typeof value === 'number') {
    return Boolean(value);
  }

  throwError(value, field, 'doc');
}

function toDocAttachment(value: RawValue, field: Field): null | Attachment {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    throwError(value, field, 'doc');
  }

  try {
    return (JSON.parse(value) as Attachment) || null;
  } catch {
    throwError(value, field, 'doc');
  }
}

function toRawCurrency(value: DocValue, fyo: Fyo, field: Field): string {
  if (isPesa(value)) {
    return value.store;
  }

  if (getIsNullOrUndef(value)) {
    return fyo.pesa(0).store;
  }

  if (typeof value === 'number') {
    return fyo.pesa(value).store;
  }

  if (typeof value === 'string') {
    return fyo.pesa(value).store;
  }

  throwError(value, field, 'raw');
}

function toRawInt(value: DocValue, field: Field): number {
  if (typeof value === 'string') {
    return safeParseInt(value);
  }

  if (getIsNullOrUndef(value)) {
    return 0;
  }

  if (typeof value === 'number') {
    return Math.floor(value);
  }

  throwError(value, field, 'raw');
}

function toRawFloat(value: DocValue, field: Field): number {
  if (typeof value === 'string') {
    return safeParseFloat(value);
  }

  if (getIsNullOrUndef(value)) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  throwError(value, field, 'raw');
}

function toRawDate(value: DocValue, field: Field): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    value = new Date(value);
  }

  if (value instanceof Date) {
    return DateTime.fromJSDate(value).toISODate();
  }

  if (value instanceof DateTime) {
    return value.toISODate();
  }

  throwError(value, field, 'raw');
}

function toRawDateTime(value: DocValue, field: Field): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof DateTime) {
    return value.toJSDate().toISOString();
  }

  throwError(value, field, 'raw');
}

function toRawCheck(value: DocValue, field: Field): number {
  if (typeof value === 'number') {
    value = Boolean(value);
  }

  if (typeof value === 'boolean') {
    return Number(value);
  }

  throwError(value, field, 'raw');
}

function toRawString(value: DocValue, field: Field): string | null {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  throwError(value, field, 'raw');
}

function toRawLink(value: DocValue, field: Field): string | null {
  if (value === null || !(value as string)?.length) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  throwError(value, field, 'raw');
}

function toRawAttachment(value: DocValue, field: Field): null | string {
  if (!value) {
    return null;
  }

  if (
    (value as Attachment)?.name &&
    (value as Attachment)?.data &&
    (value as Attachment)?.type
  ) {
    return JSON.stringify(value);
  }

  throwError(value, field, 'raw');
}

function throwError<T>(value: T, field: Field, type: 'raw' | 'doc'): never {
  throw new ValueError(
    `invalid ${type} conversion '${String(
      value
    )}' of type ${typeof value} found, field: ${JSON.stringify(field)}`
  );
}
