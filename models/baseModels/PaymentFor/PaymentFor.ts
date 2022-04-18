import Doc from 'frappe/model/doc';
import { FiltersMap, FormulaMap } from 'frappe/model/types';
import Money from 'pesa/dist/types/src/money';

export class PaymentFor extends Doc {
  formulas: FormulaMap = {
    amount: async () => {
      const outstandingAmount = this.parentdoc!.getFrom(
        this.referenceType as string,
        this.referenceName as string,
        'outstandingAmount'
      ) as Money;

      if (outstandingAmount) {
        return outstandingAmount;
      }

      return this.frappe.pesa(0);
    },
  };

  static filters: FiltersMap = {
    referenceName: () => ({
      outstandingAmount: ['>', 0],
    }),
  };
}
