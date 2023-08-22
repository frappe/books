import { ClosingAmounts } from './ClosingAmounts';
import { ClosingCash } from './ClosingCash';
import { Doc } from 'fyo/model/doc';
import { OpeningAmounts } from './OpeningAmounts';
import { OpeningCash } from './OpeningCash';

export class POSShift extends Doc {
  closingAmounts?: ClosingAmounts[];
  closingCash?: ClosingCash[];
  closingDate?: Date;
  isShiftOpen?: boolean;
  openingAmounts?: OpeningAmounts[];
  openingCash?: OpeningCash[];
  openingDate?: Date;

  get openingCashAmount() {
    if (!this.openingCash) {
      return this.fyo.pesa(0);
    }

    let openingAmount = this.fyo.pesa(0);

    this.openingCash.map((row: OpeningCash) => {
      const denomination = row.denomination ?? this.fyo.pesa(0);
      const count = row.count ?? 0;

      const amount = denomination.mul(count);
      openingAmount = openingAmount.add(amount);
    });
    return openingAmount;
  }

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

  get openingTransferAmount() {
    if (!this.openingAmounts) {
      return this.fyo.pesa(0);
    }

    const transferAmountRow = this.openingAmounts.filter(
      (row) => row.paymentMethod === 'Transfer'
    )[0];

    return transferAmountRow.amount ?? this.fyo.pesa(0);
  }
}
