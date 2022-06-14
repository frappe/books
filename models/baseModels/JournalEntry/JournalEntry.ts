import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  DefaultMap,
  FiltersMap,
  ListViewSettings,
} from 'fyo/model/types';
import { DateTime } from 'luxon';
import {
  getDocStatus,
  getLedgerLinkAction,
  getStatusMap,
  statusColor,
} from 'models/helpers';
import { Transactional } from 'models/Transactional/Transactional';
import { Money } from 'pesa';
import { LedgerPosting } from '../../Transactional/LedgerPosting';

export class JournalEntry extends Transactional {
  accounts?: Doc[];

  async getPosting() {
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);

    for (const row of this.accounts ?? []) {
      const debit = row.debit as Money;
      const credit = row.credit as Money;
      const account = row.account as string;

      if (!debit.isZero()) {
        await posting.debit(account, debit);
      } else if (!credit.isZero()) {
        await posting.credit(account, credit);
      }
    }

    return posting;
  }

  static defaults: DefaultMap = {
    date: () => DateTime.local().toISODate(),
  };

  static filters: FiltersMap = {
    numberSeries: () => ({ referenceType: 'JournalEntry' }),
  };

  static getActions(fyo: Fyo): Action[] {
    return [getLedgerLinkAction(fyo)];
  }

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: (name) => `/edit/JournalEntry/${name}`,
      columns: [
        'name',
        {
          label: t`Status`,
          fieldtype: 'Select',
          size: 'small',
          render(doc) {
            const status = getDocStatus(doc);
            const color = statusColor[status] ?? 'gray';
            const label = getStatusMap()[status];

            return {
              template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
            };
          },
        },
        'date',
        'entryType',
        'referenceNumber',
      ],
    };
  }
}
