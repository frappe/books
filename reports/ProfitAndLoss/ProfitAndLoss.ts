import { Fyo, t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { AccountRootType } from 'models/baseModels/Account/types';
import { isCredit } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { LedgerReport } from 'reports/LedgerReport';
import {
  ColumnField,
  GroupedMap,
  LedgerEntry,
  Periodicity,
} from 'reports/types';
import { Field } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { getMapFromList } from 'utils';
import { QueryFilter } from 'utils/db/types';

type DateRange = { fromDate: DateTime; toDate: DateTime };
type ValueMap = Map<DateRange, number>;
type AccountNameValueMapMap = Map<string, ValueMap>;
type BasedOn = 'Fiscal Year' | 'Date Range';
type Account = { name: string; rootType: AccountRootType; isGroup: boolean };

export class ProfitAndLoss extends LedgerReport {
  static title = t`Profit And Loss`;
  static reportName = 'profit-and-loss';

  toDate?: string;
  count?: number;
  fromYear?: number;
  toYear?: number;
  singleColumn: boolean = false;
  periodicity: Periodicity = 'Monthly';
  basedOn: BasedOn = 'Fiscal Year';

  _rawData: LedgerEntry[] = [];

  accountMap?: Record<string, Account>;

  constructor(fyo: Fyo) {
    super(fyo);
  }

  async setDefaultFilters(): Promise<void> {
    if (this.basedOn === 'Date Range' && !this.toDate) {
      this.toDate = DateTime.now().toISODate();
      this.count = 1;
    }

    if (this.basedOn === 'Fiscal Year' && !this.toYear) {
      this.toYear = DateTime.now().year;
      this.fromYear = this.toYear - 1;
    }
  }

  async setReportData(filter?: string) {
    let sort = true;
    if (
      this._rawData.length === 0 &&
      !['periodicity', 'singleColumn'].includes(filter!)
    ) {
      await this._setRawData();
      sort = false;
    }

    const map = this._getGroupedMap(sort, 'account');
    const rangeGroupedMap = await this._getGroupedByDateRanges(map);
    /**
     * TODO: Get account tree  from accountMap
     * TODO: Create Grid from rangeGroupedMap and tree
     */
  }

  async _getGroupedByDateRanges(
    map: GroupedMap
  ): Promise<AccountNameValueMapMap> {
    const dateRanges = await this._getDateRanges();
    const accountValueMap: AccountNameValueMapMap = new Map();
    const accountMap = await this._getAccountMap();

    for (const account of map.keys()) {
      const valueMap: ValueMap = new Map();
      for (const entry of map.get(account)!) {
        const key = this._getRangeMapKey(entry, dateRanges);
        if (valueMap === null) {
          continue;
        }

        const totalBalance = valueMap.get(key!) ?? 0;
        const balance = (entry.debit ?? 0) - (entry.credit ?? 0);
        const rootType = accountMap[entry.account].rootType;

        if (isCredit(rootType)) {
          valueMap.set(key!, totalBalance - balance);
        } else {
          valueMap.set(key!, totalBalance + balance);
        }
      }
      accountValueMap.set(account, valueMap);
    }

    return accountValueMap;
  }

  async _getAccountMap() {
    if (this.accountMap) {
      return this.accountMap;
    }

    const accountList: Account[] = (
      await this.fyo.db.getAllRaw('Account', {
        fields: ['name', 'rootType', 'isGroup'],
      })
    ).map((rv) => ({
      name: rv.name as string,
      rootType: rv.rootType as AccountRootType,
      isGroup: Boolean(rv.isGroup),
    }));

    this.accountMap = getMapFromList(accountList, 'name');
    return this.accountMap;
  }

  _getRangeMapKey(
    entry: LedgerEntry,
    dateRanges: DateRange[]
  ): DateRange | null {
    const entryDate = +DateTime.fromISO(
      entry.date!.toISOString().split('T')[0]
    );

    for (const dr of dateRanges) {
      if (entryDate <= +dr.toDate && entryDate > +dr.fromDate) {
        return dr;
      }
    }

    return null;
  }

  async _getDateRanges(): Promise<DateRange[]> {
    const endpoints = await this._getFromAndToDates();
    const fromDate = DateTime.fromISO(endpoints.fromDate);
    const toDate = DateTime.fromISO(endpoints.toDate);

    if (this.singleColumn) {
      return [
        {
          toDate,
          fromDate,
        },
      ];
    }

    const months: number = monthsMap[this.periodicity];
    const dateRanges: DateRange[] = [
      { toDate, fromDate: toDate.minus({ months }) },
    ];

    let count = this.count ?? 1;
    if (this.basedOn === 'Fiscal Year') {
      count = Math.ceil(((this.toYear! - this.fromYear!) * 12) / months);
    }

    for (let i = 1; i < count; i++) {
      const lastRange = dateRanges.at(-1)!;
      dateRanges.push({
        toDate: lastRange.fromDate,
        fromDate: lastRange.fromDate.minus({ months }),
      });
    }

    return dateRanges;
  }

  async _getFromAndToDates() {
    let toDate: string;
    let fromDate: string;

    if (this.basedOn === 'Date Range') {
      toDate = this.toDate!;
      const months = monthsMap[this.periodicity] * Math.max(this.count ?? 1, 1);
      fromDate = DateTime.fromISO(toDate).minus({ months }).toISODate();
    } else {
      const fy = await getFiscalEndpoints(this.toYear!, this.fromYear!);
      toDate = fy.toDate;
      fromDate = fy.fromDate;
    }

    return { fromDate, toDate };
  }

  async _getQueryFilters(): Promise<QueryFilter> {
    const filters: QueryFilter = {};
    const { fromDate, toDate } = await this._getFromAndToDates();

    const dateFilter: string[] = [];
    dateFilter.push('<=', toDate);
    dateFilter.push('>=', fromDate);

    filters.date = dateFilter;
    filters.reverted = false;
    return filters;
  }

  getFilters() {
    const periodNameMap: Record<Periodicity, string> = {
      Monthly: t`Months`,
      Quarterly: t`Quarters`,
      'Half Yearly': t`Half Years`,
      Yearly: t`Years`,
    };

    const filters = [
      {
        fieldtype: 'Select',
        options: [
          { label: t`Monthly`, value: 'Monthly' },
          { label: t`Quarterly`, value: 'Quarterly' },
          { label: t`Half Yearly`, value: 'Half Yearly' },
          { label: t`Yearly`, value: 'Yearly' },
        ],
        default: 'Monthly',
        label: t`Periodicity`,
        fieldname: 'periodicity',
      },
      {
        fieldtype: 'Select',
        options: [
          { label: t`Fiscal Year`, value: 'Fiscal Year' },
          { label: t`Date Range`, value: 'Date Range' },
        ],
        default: 'Fiscal Year',
        label: t`Based On`,
        fieldname: 'basedOn',
      },
      {
        fieldtype: 'Check',
        default: false,
        label: t`Single Column`,
        fieldname: 'singleColumn',
      },
    ] as Field[];

    if (this.basedOn === 'Date Range') {
      return [
        ...filters,
        {
          fieldtype: 'Date',
          fieldname: 'toDate',
          placeholder: t`To Date`,
          label: t`To Date`,
          required: true,
        },
        {
          fieldtype: 'Int',
          fieldname: 'count',
          placeholder: t`Number of ${periodNameMap[this.periodicity]}`,
          label: t`Number of ${periodNameMap[this.periodicity]}`,
          required: true,
        },
      ] as Field[];
    }

    const thisYear = DateTime.local().year;
    return [
      ...filters,
      {
        fieldtype: 'Date',
        fieldname: 'fromYear',
        placeholder: t`From Date`,
        label: t`From Date`,
        default: thisYear - 1,
        required: true,
      },
      {
        fieldtype: 'Date',
        fieldname: 'toYear',
        placeholder: t`To Year`,
        label: t`To Year`,
        default: thisYear,
        required: true,
      },
    ] as Field[];
  }

  getColumns(): ColumnField[] {
    const columns = [] as ColumnField[];

    return columns;
  }

  getActions(): Action[] {
    return [];
  }

  metaFilters: string[] = ['basedOn'];
}

async function getFiscalEndpoints(toYear: number, fromYear: number) {
  const fys = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'fiscalYearStart'
  )) as Date;
  const fye = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'fiscalYearEnd'
  )) as Date;

  /**
   * Get the month and the day, and
   * prepend with the passed year.
   */

  const fromDate = [
    fromYear,
    fys.toISOString().split('T')[0].split('-').slice(1),
  ].join('-');

  const toDate = [
    toYear,
    fye.toISOString().split('T')[0].split('-').slice(1),
  ].join('-');

  return { fromDate, toDate };
}

const monthsMap: Record<Periodicity, number> = {
  Monthly: 1,
  Quarterly: 3,
  'Half Yearly': 6,
  Yearly: 12,
};
