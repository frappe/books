import Money from 'pesa/dist/types/src/money';
import { RawValue } from 'schemas/types';

export type DocValue = string | number | boolean | Date | Money;

export type DocValueMap = Record<string, DocValue | DocValueMap[]>;
export type RawValueMap = Record<string, RawValue | RawValueMap[]>;

export type SingleValue<T> = {
  fieldname: string;
  parent: string;
  value: T;
}[];
