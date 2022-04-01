import Doc from 'frappe/model/doc';
import Money from 'pesa/dist/types/src/money';
import { RawValue } from 'schemas/types';

export type DocValue = string | number | boolean | Date | Money | null;
export type DocValueMap = Record<string, DocValue | Doc[] | DocValueMap[]>;
export type RawValueMap = Record<string, RawValue | RawValueMap[]>;

export type SingleValue<T> = {
  fieldname: string;
  parent: string;
  value: T;
}[];
