import Doc from 'frappe/model/doc';
import { FormulaMap } from 'frappe/model/types';
import Money from 'pesa/dist/types/src/money';

export class TaxSummary extends Doc {
  account?: string;
  rate?: number;
  amount?: Money;
  baseAmount?: Money;

  formulas: FormulaMap = {
    baseAmount: async () => {
      const amount = this.amount as Money;
      const exchangeRate = (this.parentdoc?.exchangeRate ?? 1) as number;
      return amount.mul(exchangeRate);
    },
  };
}
