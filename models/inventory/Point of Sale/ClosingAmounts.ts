import { Doc } from 'fyo/model/doc';
import { FormulaMap } from 'fyo/model/types';
import { Money } from 'pesa';

export class ClosingAmounts extends Doc {
  closingAmount?: Money;
  differenceAmount?: Money;
  expectedAmount?: Money;
  openingAmount?: Money;
  paymentMethod?: string;

  formulas: FormulaMap = {
    differenceAmount: {
      formula: () => {
        if (!this.closingAmount) {
          return this.fyo.pesa(0);
        }

        if (!this.expectedAmount) {
          return this.fyo.pesa(0);
        }

        return this.closingAmount.sub(this.expectedAmount);
      },
    },
  };
}
