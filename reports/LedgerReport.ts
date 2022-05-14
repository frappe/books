import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { Report } from 'reports/Report';
import { GroupedMap, LedgerEntry, RawLedgerEntry } from 'reports/types';
import { QueryFilter } from 'utils/db/types';

type GroupByKey = 'account' | 'party' | 'referenceName';

export abstract class LedgerReport extends Report {
  static title = t`General Ledger`;
  static reportName = 'general-ledger';

  _rawData: LedgerEntry[] = [];

  _getGroupByKey() {
    let groupBy: GroupByKey = 'referenceName';
    if (this.groupBy && this.groupBy !== 'none') {
      groupBy = this.groupBy as GroupByKey;
    }
    return groupBy;
  }

  _getGroupedMap(sort: boolean, groupBy?: GroupByKey): GroupedMap {
    groupBy ??= this._getGroupByKey();
    /**
     * Sort rows by ascending or descending
     */
    if (sort) {
      this._rawData.sort((a, b) => {
        if (this.ascending) {
          return +a.date! - +b.date!;
        }

        return +b.date! - +a.date!;
      });
    }

    /**
     * Map remembers the order of insertion
     * ∴ presorting maintains grouping order
     */
    const map: GroupedMap = new Map();
    for (const entry of this._rawData) {
      const groupingKey = entry[groupBy];
      if (!map.has(groupingKey)) {
        map.set(groupingKey, []);
      }

      map.get(groupingKey)!.push(entry);
    }

    return map;
  }

  async _setRawData() {
    const fields = [
      'name',
      'account',
      'date',
      'debit',
      'credit',
      'referenceType',
      'referenceName',
      'party',
      'reverted',
      'reverts',
    ];

    const filters = await this._getQueryFilters();
    const entries = (await this.fyo.db.getAllRaw(
      ModelNameEnum.AccountingLedgerEntry,
      {
        fields,
        filters,
        orderBy: 'date',
        order: this.ascending ? 'asc' : 'desc',
      }
    )) as RawLedgerEntry[];

    this._rawData = entries.map((entry) => {
      return {
        name: parseInt(entry.name),
        account: entry.account,
        date: new Date(entry.date),
        debit: parseFloat(entry.debit),
        credit: parseFloat(entry.credit),
        balance: 0,
        referenceType: entry.referenceType,
        referenceName: entry.referenceName,
        party: entry.party,
        reverted: Boolean(entry.reverted),
        reverts: entry.reverts,
      } as LedgerEntry;
    });
  }

  abstract _getQueryFilters(): Promise<QueryFilter>;
}
