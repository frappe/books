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
import {
  getRawStockLedgerEntries,
  getStockBalanceEntries,
  getStockLedgerEntries,
} from 'reports/inventory/helpers';
import { ValuationMethod } from 'models/inventory/types';
import { Invoice } from '../Invoice/Invoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';
import { LoyaltyProgram } from '../LoyaltyProgram/LoyaltyProgram';
import { DocValue } from 'fyo/core/types';
import { Party } from '../Party/Party';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { Doc } from 'fyo/model/doc';
import { sendNtfyNotification } from 'src/utils/ntfy';
import { Item } from 'models/baseModels/Item/Item';
import { DateTime } from 'luxon';

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
        throw new ValidationError(this.fyo.t('Points must be greather than 0'));
      }

      if ((value as number) > (partyDoc?.loyaltyPoints || 0)) {
        throw new ValidationError(
          this.fyo.t('{party} only has {points} points', { party: this.party as string, points: partyDoc.loyaltyPoints as number } as any)
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
            this.fyo.t('no need {points} points to purchase this item', { points: value as number } as any)
          );
        }
      }
    },
  };

  async afterSubmit() {
    await super.afterSubmit();

    if (this.isPOS) {
      let payments = this.payments as any[];
      if (!payments || payments.length === 0) {
        payments = await this.getLinkedPayments();
      }
      const paymentMethods = (payments ?? []).map((p: any) => p.paymentMethod).join(', ') || 'N/A';

      const formatNumber = (num: number | string) => {
        return Number(num).toLocaleString('en-US');
      };

      let productList = (this.items ?? []).map((item, index) => {
          const itemName = item.item as string;
          const qty = item.quantity || 0;
          const amountValue = item.amount ? item.amount.toString() : '0';
          const amount = formatNumber(amountValue);

          return index + 1 + '. ' + itemName + ' (x' + qty + ') - ' + amount;
        })
        .join('\n');

      const message = '\n\nFollowing products have just been sold:\n\n' + productList + '\n\n**Total:** ' + formatNumber(this.grandTotal!.toString());

      await sendNtfyNotification(this.fyo, message, 'New Sale!', 'fire');
    }

    // Low Stock Notification
    const itemsToRestock: string[] = [];
    const valuationMethod =
      (this.fyo.singles.InventorySettings?.valuationMethod as ValuationMethod) ??
      ValuationMethod.FIFO;
    const rawSLEs = await getRawStockLedgerEntries(this.fyo);
    const rawData = getStockLedgerEntries(rawSLEs, valuationMethod);
    const stockBalance = getStockBalanceEntries(rawData, {});
    const balanceMap: Record<string, number> = {};
    for (const row of stockBalance) {
      balanceMap[row.item] ??= 0;
      balanceMap[row.item] += row.balanceQuantity;
    }

    for (const invItem of this.items ?? []) {
      const itemName = invItem.item as string;
      const itemDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.Item,
        itemName
      )) as Item;

      if (!itemDoc || !itemDoc.trackItem || itemDoc.restockQuantity === undefined) {
        continue;
      }

      const balance = balanceMap[itemName] || 0;
      if (balance < itemDoc.restockQuantity) {
        itemsToRestock.push(`${itemName} - ${balance} remaining`);
      }
    }

    if (itemsToRestock.length > 0) {
      const restockMessage =
        "You're about to run out of the following items in your stock;\n\n" +
        itemsToRestock.join('\n') +
        '\n\nPlease refill your inventory';

      await sendNtfyNotification(
        this.fyo,
        restockMessage,
        'Inventory Restock Required',
        'rotating_light',
        'high'
      );
    }
  }

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