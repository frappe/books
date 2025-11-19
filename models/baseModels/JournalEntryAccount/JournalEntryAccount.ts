import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap, ReadOnlyMap } from 'fyo/model/types';
import { Money } from 'pesa';

export class JournalEntryAccount extends Doc {
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

  /**
   * Overridden to defer editability to the parent document.
   * If the parent JournalEntry is editable (e.g., it's a Bank Entry),
   * then this row should also be editable.
   */
  get canEdit() {
    if (this.parentdoc) {
      return this.parentdoc.canEdit;
    }
    return true;
  }

  /**
   * Explicitly define fields as not read-only when the document is editable.
   * This prevents the UI from locking the 'account' field on submitted docs.
   */
  readOnly: ReadOnlyMap = {
    account: () => !this.canEdit,
    debit: () => !this.canEdit,
    credit: () => !this.canEdit,
  };

  formulas: FormulaMap = {
    debit: {
      formula: () => this.getAutoDebitCredit('debit'),
    },
    credit: {
      formula: () => this.getAutoDebitCredit('credit'),
    },
  };

  static filters: FiltersMap = {
    account: () => ({ isGroup: false }),
  };
}