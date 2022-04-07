import Doc from 'frappe/model/doc';
import Money from 'pesa/dist/types/src/money';
import { RawValue } from 'schemas/types';
import { DatabaseDemuxBase } from 'utils/db/types';

export type DocValue = string | number | boolean | Date | Money | null;
export type DocValueMap = Record<string, DocValue | Doc[] | DocValueMap[]>;
export type RawValueMap = Record<string, RawValue | RawValueMap[]>;

export type SingleValue<T> = {
  fieldname: string;
  parent: string;
  value: T;
}[];

/**
 * DatabaseDemuxConstructor: type for a constructor that returns a DatabaseDemuxBase
 * it's typed this way because `typeof AbstractClass` is invalid as abstract classes
 * can't be initialized using `new`.
 */
export type DatabaseDemuxConstructor = new (isElectron?: boolean)=> DatabaseDemuxBase