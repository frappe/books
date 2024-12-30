import { ListViewSettings } from 'fyo/model/types';
import { ClosingAmounts } from './ClosingAmounts';
import { ClosingCash } from './ClosingCash';
import { Doc } from 'fyo/model/doc';

export class POSClosingShift extends Doc {
  closingAmounts?: ClosingAmounts[];
  closingCash?: ClosingCash[];
  closingDate?: Date;
  openingShift?: string;

  get closingCashAmount() {
    if (!this.closingCash) {
      return this.fyo.pesa(0);
    }

    let closingAmount = this.fyo.pesa(0);

    this.closingCash.map((row: ClosingCash) => {
      const denomination = row.denomination ?? this.fyo.pesa(0);
      const count = row.count ?? 0;

      const amount = denomination.mul(count);
      closingAmount = closingAmount.add(amount);
    });
    return closingAmount;
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'closingDate'],
    };
  }
}
