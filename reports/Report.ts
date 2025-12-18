import { Fyo } from 'fyo';
import { Converter } from 'fyo/core/converter';
import { DocValue } from 'fyo/core/types';
import { Action } from 'fyo/model/types';
import Observable from 'fyo/utils/observable';
import { Field, RawValue } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import { ColumnField, ReportData } from './types';

export abstract class Report extends Observable<RawValue> {
  static title: string;
  static reportName: string;
  static isInventory = false;

  fyo: Fyo;
  columns: ColumnField[] = [];
  filters: Field[] = [];
  reportData: ReportData;
  usePagination = false;
  shouldRefresh = false;
  abstract loading: boolean;

  constructor(fyo: Fyo) {
    super();
    this.fyo = fyo;
    this.reportData = [];
  }

  get title(): string {
    return (this.constructor as typeof Report).title;
  }

  get reportName(): string {
    return (this.constructor as typeof Report).reportName;
  }

  async initialize() {
    /**
     * Not in constructor cause possibly async.
     */

    await this.setDefaultFilters();
    this.filters = await this.getFilters();
    this.columns = await this.getColumns();
    await this.setReportData();
  }

  // Override the get method to provide the correct display value for UI components.
  // This will convert stored comma-separated strings back into arrays for multi-select fields.
  get(key: string): RawValue | RawValue[] | undefined {
    // Retrieve the raw stored value directly from the instance property.
    // Assuming `this[key]` is where the `set` method stores values.
    const rawStoredValue = (this as any)[key] as RawValue;

    const field = this.filters.find((f) => f.fieldname === key);
    if (!field) {
      // If no field definition, return the raw value as is.
      return rawStoredValue;
    }

    const isMultiSelectFieldType = field.fieldtype === 'Link' || field.fieldtype === 'AutoComplete';

    if (isMultiSelectFieldType) {
      if (typeof rawStoredValue === 'string') {
        if (rawStoredValue === '') {
          // An empty string in storage means 'Select All', which the UI expects as an empty array.
          return [];
        } else {
          // For a non-empty string, split it into an array of selected items for UI display.
          return rawStoredValue.split(',').map((s) => s.trim());
        }
      }
      // If it's not a string (e.g., null, undefined, or already an array for some reason), return it directly.
      return rawStoredValue;
    }

    // For non-multi-select fields, return the raw stored value without transformation.
    return rawStoredValue;
  }

  get filterMap() {
    const filterMap: Record<string, RawValue> = {};
    for (const field of this.filters) {
      const { fieldname } = field;
      // IMPORTANT: For `filterMap`, we need the raw stored value (string),
      // not the potentially transformed array from the overridden `get` method.
      // We explicitly access the instance property to get the raw string.
      const rawValueForBackend = (this as any)[fieldname] as RawValue;

      // Check if the current field is a multi-select type.
      const isMultiSelectFieldType = field.fieldtype === 'Link' || field.fieldtype === 'AutoComplete';

      // Include the filter in the map if its raw value is not null/undefined OR
      // if it's a multi-select field with an empty string (representing 'Select All').
      if (!getIsNullOrUndef(rawValueForBackend) || (isMultiSelectFieldType && rawValueForBackend === '')) {
        filterMap[fieldname] = rawValueForBackend;
      }
    }

    return filterMap;
  }

  async set(key: string, value: DocValue, callPostSet = true) {
    const field = this.filters.find((f) => f.fieldname === key);
    if (field === undefined) {
      // If the field isn't defined in the report's filters, we can't process it.
      return;
    }

    const isMultiSelectFieldType = field.fieldtype === 'Link' || field.fieldtype === 'AutoComplete';

    let finalValueToStore: RawValue;
    let isValueForSelectAll = false;

    // Explicitly handle array values for multi-select fields.
    if (isMultiSelectFieldType && Array.isArray(value)) {
      if (value.length === 0) {
        // An empty array means 'Select All', stored as an empty string.
        finalValueToStore = '';
        isValueForSelectAll = true;
      } else {
        // Convert non-empty array of selected items to a comma-separated string for storage.
        // Assuming array elements are of a type that can be converted to string (e.g., project names).
        finalValueToStore = value.map((item) => String(item)).join(',');
      }
    } else {
      // For all other field types or if `value` is already a scalar (string, number, boolean, null),
      // use Converter.toRawValue for conversion.
      finalValueToStore = Converter.toRawValue(value, field, this.fyo);
    }

    // Retrieve the previous RAW stored value directly from the instance property
    // to ensure a like-for-like comparison (string vs string), bypassing the 'get' method's UI transformation.
    const prevRawValue = (this as any)[key] as RawValue;

    // If the raw stored value is identical to the new value to store, no update is needed.
    if (prevRawValue === finalValueToStore) {
      return;
    }

    // If the value to store is null/undefined and it's NOT the 'Select All' empty string,
    // then delete the property. Otherwise, set the property with the final value.
    if (getIsNullOrUndef(finalValueToStore) && !isValueForSelectAll) {
      delete (this as any)[key]; // Use explicit 'any' for deletion as well for consistency
    } else {
      (this as any)[key] = finalValueToStore; // Explicitly set the raw value
    }

    if (callPostSet) {
      await this.updateData(key);
    }
  }

  async updateData(key?: string, force?: boolean) {
    await this.setDefaultFilters();
    this.filters = await this.getFilters();
    this.columns = await this.getColumns();
    await this.setReportData(key, force);
  }

  /**
   * Should first check if filter value is set
   * and update only if it is not set.
   */
  abstract setDefaultFilters(): void | Promise<void>;
  abstract getActions(): Action[];
  abstract getFilters(): Field[] | Promise<Field[]>;
  abstract getColumns(): ColumnField[] | Promise<ColumnField[]>;
  abstract setReportData(filter?: string, force?: boolean): Promise<void>;
}
