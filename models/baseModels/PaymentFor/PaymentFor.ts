import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap, ValidationMap } from 'fyo/model/types';
import { NotFoundError } from 'fyo/utils/errors';
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

        const party = await this.parentdoc?.loadAndGetLink('party');
        if (!party) {
          return ModelNameEnum.SalesInvoice;
        }

        if (party.role === PartyRoleEnum.Supplier) {
          return ModelNameEnum.PurchaseInvoice;
        }

        return ModelNameEnum.SalesInvoice;
      },
    },
    referenceName: {
      formula: async () => {
        if (!this.referenceName || !this.referenceType) {
          return this.referenceName;
        }

        const exists = await this.fyo.db.exists(
          this.referenceType,
          this.referenceName
        );

        if (!exists) {
          return null;
        }

        return this.referenceName;
      },
      dependsOn: ['referenceType'],
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
      const zero =
        '0.' +
        '0'.repeat(doc.fyo.singles.SystemSettings?.internalPrecision ?? 11);

      const baseFilters = {
        outstandingAmount: ['!=', zero],
        submitted: true,
        cancelled: false,
      };

      const party = doc?.parentdoc?.party as undefined | string;
      if (!party) {
        return baseFilters;
      }

      return { ...baseFilters, party };
    },
  };

  validations: ValidationMap = {
    referenceName: async (value: DocValue) => {
      const exists = await this.fyo.db.exists(
        this.referenceType!,
        value as string
      );
      if (exists) {
        return;
      }

      throw new NotFoundError(
        t`${this.fyo.schemaMap[this.referenceType!]?.label!} ${
          value as string
        } does not exist`,
        false
      );
    },
  };
}
