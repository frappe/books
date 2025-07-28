import { Fyo, t } from 'fyo';
import { Action, ListViewSettings, ValidationMap } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import {
  getAddedLPWithGrandTotal,
  getInvoiceActions,
  getReturnLoyaltyPoints,
  getTransactionStatusColumn,
} from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';
import { LoyaltyProgram } from '../LoyaltyProgram/LoyaltyProgram';
import { DocValue } from 'fyo/core/types';
import { Party } from '../Party/Party';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { Doc } from 'fyo/model/doc';

export class SalesInvoice extends Invoice {
  items?: SalesInvoiceItem[];

  async getPosting() {
    const exchangeRate = this.exchangeRate ?? 1;
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);
    if (this.isReturn) {
      await posting.credit(this.account!, this.baseGrandTotal!);
    } else {
      await posting.debit(this.account!, this.baseGrandTotal!);
    }

    for (const item of this.items!) {
      if (this.isReturn) {
        await posting.debit(item.account!, item.amount!.mul(exchangeRate));
        continue;
      }
      await posting.credit(item.account!, item.amount!.mul(exchangeRate));
    }

    if (this.redeemLoyaltyPoints) {
      const loyaltyProgramDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.LoyaltyProgram,
        this.loyaltyProgram
      )) as LoyaltyProgram;

      let totalAmount;

      if (this.isReturn) {
        totalAmount = this.fyo.pesa(await getReturnLoyaltyPoints(this));
      } else {
        totalAmount = await getAddedLPWithGrandTotal(
          this.fyo,
          this.loyaltyProgram as string,
          this.loyaltyPoints as number
        );
      }

      await posting.debit(
        loyaltyProgramDoc.expenseAccount as string,
        totalAmount
      );

      await posting.credit(this.account!, totalAmount);
    }

    if (this.taxes) {
      for (const tax of this.taxes) {
        if (this.isReturn) {
          await posting.debit(tax.account!, tax.amount!.mul(exchangeRate));
          continue;
        }
        await posting.credit(tax.account!, tax.amount!.mul(exchangeRate));
      }
    }

    const discountAmount = this.getTotalDiscount();
    const discountAccount = this.fyo.singles.AccountingSettings
      ?.discountAccount as string | undefined;
    if (discountAccount && discountAmount.isPositive()) {
      if (this.isReturn) {
        await posting.credit(discountAccount, discountAmount.mul(exchangeRate));
      } else {
        await posting.debit(discountAccount, discountAmount.mul(exchangeRate));
      }
    }

    await posting.makeRoundOffEntry();
    return posting;
  }

  validations: ValidationMap = {
    loyaltyPoints: async (value: DocValue) => {
      if (!this.redeemLoyaltyPoints || this.isSubmitted || this.isReturn) {
        return;
      }

      const partyDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.Party,
        this.party
      )) as Party;

      if ((value as number) <= 0) {
        throw new ValidationError(t`Points must be greather than 0`);
      }

      if ((value as number) > (partyDoc?.loyaltyPoints || 0)) {
        throw new ValidationError(
          t`${this.party as string} only has ${
            partyDoc.loyaltyPoints as number
          } points`
        );
      }

      const loyaltyProgramDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.LoyaltyProgram,
        this.loyaltyProgram
      )) as LoyaltyProgram;

      if (!this?.grandTotal) {
        return;
      }

      const loyaltyPoint =
        ((value as number) || 0) *
        ((loyaltyProgramDoc?.conversionFactor as number) || 0);

      if (!this.isReturn) {
        const totalDiscount = this.getTotalDiscount();
        let baseGrandTotal;

        if (!this.taxes!.length) {
          baseGrandTotal = (this.netTotal as Money).sub(totalDiscount);
        } else {
          baseGrandTotal = ((this.taxes ?? []) as Doc[])
            .map((doc) => doc.amount as Money)
            .reduce((a, b) => {
              if (this.isReturn) {
                return a.abs().add(b.abs()).neg();
              }
              return a.add(b.abs());
            }, (this.netTotal as Money).abs())
            .sub(totalDiscount);
        }

        if (baseGrandTotal?.lt(loyaltyPoint)) {
          throw new ValidationError(
            t`no need ${value as number} points to purchase this item`
          );
        }
      }
    },
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'baseGrandTotal',
        'outstandingAmount',
      ],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    return getInvoiceActions(fyo, ModelNameEnum.SalesInvoice);
  }
}
