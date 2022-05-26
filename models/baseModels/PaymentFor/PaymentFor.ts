import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { PartyRoleEnum } from '../Party/types';
import { Payment } from '../Payment/Payment';

export class PaymentFor extends Doc {
  parentdoc?: Payment | undefined;
  referenceType?: ModelNameEnum.SalesInvoice | ModelNameEnum.PurchaseInvoice;
  referenceName?: string;
  amount?: Money;

  formulas: FormulaMap = {
    referenceType: {
      formula: async () => {
        if (this.referenceType) {
          return;
        }

        const party = this.parentdoc!.party;
        if (party === undefined) {
          return ModelNameEnum.SalesInvoice;
        }

        const role = await this.fyo.getValue(
          ModelNameEnum.Party,
          party,
          'role'
        );

        if (role === PartyRoleEnum.Supplier) {
          return ModelNameEnum.PurchaseInvoice;
        }

        return ModelNameEnum.SalesInvoice;
      },
    },
    amount: {
      formula: async () => {
        if (!this.referenceName) {
          return this.fyo.pesa(0);
        }

        const outstandingAmount = (await this.fyo.getValue(
          this.referenceType as string,
          this.referenceName as string,
          'outstandingAmount'
        )) as Money;

        if (outstandingAmount) {
          return outstandingAmount;
        }

        return this.fyo.pesa(0);
      },
      dependsOn: ['referenceName'],
    },
  };

  static filters: FiltersMap = {
    referenceName: (doc) => {
      const baseFilters = {
        outstandingAmount: ['>', 0],
        submitted: true,
        cancelled: false,
      };

      const party = doc?.parentdoc?.party as undefined | string;
      if (party === undefined) {
        return baseFilters;
      }

      return { ...baseFilters, party };
    },
  };
}
