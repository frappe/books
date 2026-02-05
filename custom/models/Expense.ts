import { Doc } from 'fyo/model/doc';
import { DefaultMap, FiltersMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { getNumberSeries } from 'models/helpers';
import { QueryFilter } from 'utils/db/types';

export class Expense extends Doc {
  date?: Date;
  vendor?: string;
  expense_account?: string;
  payment_account?: string;
  amount?: any;
  description?: string;

  static defaults: DefaultMap = {
    numberSeries: () => 'Exp-',
    date: () => new Date(),
  };

  static filters: FiltersMap = {
    expense_account: (): QueryFilter => ({
      rootType: 'Expense',
      isGroup: false,
    }),
    payment_account: (): QueryFilter => ({
      accountType: ['in', ['Bank', 'Cash']],
      isGroup: false,
    }),
  };

  static getListViewSettings() {
    return {
      columns: ['name', 'date', 'vendor', 'expense_account', 'amount', 'description'],
    };
  }

  async afterSubmit() {
    const journalEntry = this.fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
      entryType: 'Journal Entry',
      date: this.date,
      userRemark: this.description || `Expense: ${this.name}`,
      accounts: [
        {
          account: this.expense_account,
          debit: this.amount,
        },
        {
          account: this.payment_account,
          credit: this.amount,
        },
      ],
    });
    await journalEntry.sync();
    await journalEntry.submit();
  }
}
