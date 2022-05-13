import { Fyo } from 'fyo';
import { Action } from 'fyo/model/types';
import Observable from 'fyo/utils/observable';
import { Field, RawValue } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import { ColumnField, ReportData } from './types';

export abstract class Report extends Observable<RawValue> {
  static title: string;
  static reportName: string;

  fyo: Fyo;
  columns: ColumnField[];
  filters: Field[];
  reportData: ReportData;

  abstract getActions(): Action[];
  abstract getFilters(): Field[];

  constructor(fyo: Fyo) {
    super();
    this.fyo = fyo;
    this.reportData = [];
    this.filters = this.getFilters();
    this.columns = this.getColumns();
    this.initializeFilters();
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

  async set(key: string, value: RawValue) {
    const field = this.filters.find((f) => f.fieldname === key);
    if (field === undefined) {
      return;
    }

    const prevValue = this[key];
    if (prevValue === value) {
      return;
    }

    if (getIsNullOrUndef(value)) {
      delete this[key];
    } else {
      this[key] = value;
    }

    this.columns = this.getColumns();
    await this.setReportData(key);
  }

  initializeFilters() {
    for (const field of this.filters) {
      if (!field.default) {
        this[field.fieldname] = undefined;
        continue;
      }

      this[field.fieldname] = field.default;
    }
  }

  abstract getColumns(): ColumnField[];
  abstract setReportData(filter?: string): Promise<void>;
}
