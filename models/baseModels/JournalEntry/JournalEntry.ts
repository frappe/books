import { Fyo } from 'fyo';
import Doc from 'fyo/model/doc';
import {
  Action,
  DefaultMap,
  FiltersMap,
  ListViewSettings,
} from 'fyo/model/types';
import { DateTime } from 'luxon';
import { getLedgerLinkAction } from 'models/helpers';
import Money from 'pesa/dist/types/src/money';
import { LedgerPosting } from '../../../accounting/ledgerPosting';

export class JournalEntry extends Doc {
  accounts: Doc[] = [];

  getPosting() {
    const entries = new LedgerPosting({ reference: this }, this.fyo);

    for (const row of this.accounts) {
      const debit = row.debit as Money;
      const credit = row.credit as Money;
      const account = row.account as string;

      if (!debit.isZero()) {
        entries.debit(account, debit);
      } else if (!credit.isZero()) {
        entries.credit(account, credit);
      }
    }

    return entries;
  }

  async beforeUpdate() {
    this.getPosting().validateEntries();
  }

  async beforeInsert() {
    this.getPosting().validateEntries();
  }

  async beforeSubmit() {
    await this.getPosting().post();
  }

  async afterRevert() {
    await this.getPosting().postReverse();
  }

  defaults: DefaultMap = {
    date: () => DateTime.local().toISODate(),
  };

  static filters: FiltersMap = {
    numberSeries: () => ({ referenceType: 'JournalEntry' }),
  };

  static getActions(fyo: Fyo): Action[] {
    return [getLedgerLinkAction(fyo)];
  }

  static getListViewSettings(fyo: Fyo): ListViewSettings {
    return {
      formRoute: (name) => `/edit/JournalEntry/${name}`,
      columns: [
        'date',
        {
          label: fyo.t`Status`,
          fieldtype: 'Select',
          size: 'small',
          render(doc) {
            let status = 'Draft';
            let color = 'gray';
            if (doc.submitted) {
              color = 'green';
              status = 'Submitted';
            }

            if (doc.cancelled) {
              color = 'red';
              status = 'Cancelled';
            }

            return {
              template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
            };
          },
        },
        {
          label: fyo.t`Entry ID`,
          fieldtype: 'Data',
          fieldname: 'name',
          getValue(doc) {
            return doc.name as string;
          },
        },
        'entryType',
        'referenceNumber',
      ],
    };
  }
}
