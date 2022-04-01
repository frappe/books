import { DocValue } from 'frappe/core/types';
import Doc from './doc';

/**
 * The functions below are used for dynamic evaluation
 * and setting of field types.
 *
 * Since they are set directly on the doc, they can
 * access the doc  by using `this`.
 *
 * - `Formula`: Async function used for obtaining a computed value such as amount (rate * qty).
 * - `Default`: Regular function used to dynamically set the default value, example new Date().
 * - `Validation`: Async function that throw an error if the value is invalid.
 * - `Required`: Regular function used to decide if a value is mandatory (there are !notnul in the db).
 */
export type Formula = () => Promise<DocValue>;
export type Default = () => DocValue;
export type Validation = (value: DocValue) => Promise<void>;
export type Required = () => boolean;

export type FormulaMap = Record<string, Formula | undefined>;
export type DefaultMap = Record<string, Default | undefined>;
export type ValidationMap = Record<string, Validation | undefined>;
export type RequiredMap = Record<string, Required | undefined>;

export type DependsOnMap = Record<string, string[]>

/**
 * Should add this for hidden too

 */
