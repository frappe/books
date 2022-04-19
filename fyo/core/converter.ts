import { Fyo } from 'fyo';
import Doc from 'fyo/model/doc';
import Money from 'pesa/dist/types/src/money';
import { FieldType, FieldTypeEnum, RawValue } from 'schemas/types';
import { DatabaseHandler } from './dbHandler';
import { DocValue, DocValueMap, RawValueMap } from './types';

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
    if (Array.isArray(docValueMap)) {
      return docValueMap.map((dv) => this.#toRawValueMap(schemaName, dv));
    } else {
      return this.#toRawValueMap(schemaName, docValueMap);
    }
  }

  static toDocValue(
    value: RawValue,
    fieldtype: FieldType,
    fyo: Fyo
  ): DocValue {
    switch (fieldtype) {
      case FieldTypeEnum.Currency:
        return fyo.pesa((value ?? 0) as string | number);
      case FieldTypeEnum.Date:
        return new Date(value as string);
      case FieldTypeEnum.Datetime:
        return new Date(value as string);
      case FieldTypeEnum.Int:
        return +(value as string | number);
      case FieldTypeEnum.Float:
        return +(value as string | number);
      case FieldTypeEnum.Check:
        return Boolean(value as number);
      default:
        return String(value);
    }
  }

  static toRawValue(value: DocValue, fieldtype: FieldType): RawValue {
    switch (fieldtype) {
      case FieldTypeEnum.Currency:
        return (value as Money).store;
      case FieldTypeEnum.Date:
        return (value as Date).toISOString().split('T')[0];
      case FieldTypeEnum.Datetime:
        return (value as Date).toISOString();
      case FieldTypeEnum.Int: {
        if (typeof value === 'string') {
          return parseInt(value);
        }

        return Math.floor(value as number);
      }
      case FieldTypeEnum.Float: {
        if (typeof value === 'string') {
          return parseFloat(value);
        }

        return value as number;
      }
      case FieldTypeEnum.Check:
        return Number(value);
      default:
        return String(value);
    }
  }

  #toDocValueMap(schemaName: string, rawValueMap: RawValueMap): DocValueMap {
    const fieldValueMap = this.db.fieldValueMap[schemaName];
    const docValueMap: DocValueMap = {};

    for (const fieldname in rawValueMap) {
      const field = fieldValueMap[fieldname];
      const rawValue = rawValueMap[fieldname];

      if (Array.isArray(rawValue)) {
        docValueMap[fieldname] = rawValue.map((rv) =>
          this.#toDocValueMap(schemaName, rv)
        );
      } else {
        docValueMap[fieldname] = Converter.toDocValue(
          rawValue,
          field.fieldtype,
          this.fyo
        );
      }
    }

    return docValueMap;
  }

  #toRawValueMap(schemaName: string, docValueMap: DocValueMap): RawValueMap {
    const fieldValueMap = this.db.fieldValueMap[schemaName];
    const rawValueMap: RawValueMap = {};

    for (const fieldname in docValueMap) {
      const field = fieldValueMap[fieldname];
      const docValue = docValueMap[fieldname];

      if (Array.isArray(docValue)) {
        rawValueMap[fieldname] = docValue.map((value) => {
          if (value instanceof Doc) {
            return this.#toRawValueMap(schemaName, value.getValidDict());
          }

          return this.#toRawValueMap(schemaName, value as DocValueMap);
        });
      } else {
        rawValueMap[fieldname] = Converter.toRawValue(
          docValue,
          field.fieldtype
        );
      }
    }

    return rawValueMap;
  }
}
