import Doc from 'fyo/model/doc';
import { FiltersMap, FormulaMap } from 'fyo/model/types';
import Money from 'pesa/dist/types/src/money';

export class JournalEntryAccount extends Doc {
  getAutoDebitCredit(type: 'debit' | 'credit') {
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
    debit: async () => this.getAutoDebitCredit('debit'),
    credit: async () => this.getAutoDebitCredit('credit'),
  };

  static filters: FiltersMap = {
    account: () => ({ isGroup: false }),
  };
}