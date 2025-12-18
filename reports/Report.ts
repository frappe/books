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

  get filterMap() {
    const filterMap: Record<string, RawValue> = {};
    for (const { fieldname } of this.filters) {
      const value = this.get(fieldname);
      if (getIsNullOrUndef(value)) {
        continue;
      }

      filterMap[fieldname] = value;
    }

    return filterMap;
  }

  async set(key: string, value: DocValue, callPostSet = true) {
    const field = this.filters.find((f) => f.fieldname === key);
    if (field === undefined) {
      return;
    }

    // Check if the current field is a multi-select type.
    // We assume Link and AutoComplete fields can be multi-select.
    const isMultiSelectFieldType = field.fieldtype === 'Link' || field.fieldtype === 'AutoComplete';

    let finalValueToStore: RawValue;
    let isValueForSelectAll = false;

    // If the incoming value is an empty array, it often signifies 'Select All' for multi-selects.
    if (isMultiSelectFieldType && Array.isArray(value) && value.length === 0) {
      // Store an empty string to represent 'Select All' for multi-selects.
      // This string will be passed to the backend, which should interpret it correctly.
      finalValueToStore = '';
      isValueForSelectAll = true;
    } else {
      // For other cases, convert the value to RawValue.
      // This will handle single-select fields, non-empty multi-select arrays (e.g., ['proj1', 'proj2'] -> 'proj1,proj2'),
      // and other field types.
      finalValueToStore = Converter.toRawValue(value, field, this.fyo);
    }

    const prevValue = this[key];
    // If the value hasn't changed, no need to update.
    if (prevValue === finalValueToStore) {
      return;
    }

    // If `finalValueToStore` is considered "null or undefined" by `getIsNullOrUndef`
    // but it's actually the "Select All" state for a multi-select field,
    // we should explicitly set it instead of deleting the property.
    if (getIsNullOrUndef(finalValueToStore) && !isValueForSelectAll) {
      delete this[key];
    } else {
      this[key] = finalValueToStore;
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
