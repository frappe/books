import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap, HiddenMap } from 'fyo/model/types';
import { Money } from 'pesa';

export class JournalEntryAccount extends Doc {
  account?: string;
  debit?: Money;
  credit?: Money;
  project?: string;

  getAutoDebitCredit(type: 'debit' | 'credit') {
    const currentValue = this.get(type) as Money;
    if (!currentValue.isZero()) {
      return;
    }

    const otherType = type === 'debit' ? 'credit' : 'debit';
    const otherTypeValue = this.get(otherType) as Money;
    if (!otherTypeValue.isZero()) {
      return this.fyo.pesa(0);
    }

    const totalType = this.parentdoc!.getSum('accounts', type, false) as Money;
    const totalOtherType = this.parentdoc!.getSum(
      'accounts',
      otherType,
      false
    ) as Money;

    if (totalType.lt(totalOtherType)) {
      return totalOtherType.sub(totalType);
    }
  }

  formulas: FormulaMap = {
    debit: {
      formula: () => this.getAutoDebitCredit('debit'),
    },
    credit: {
      formula: () => this.getAutoDebitCredit('credit'),
    },
  };

  hidden: HiddenMap = {
    project: () => !this.fyo.singles.AccountingSettings?.enableProjects,
  };

  static filters: FiltersMap = {
    account: () => ({ isGroup: false }),
    project: () => ({ status: 'Active' }),
  };
}
