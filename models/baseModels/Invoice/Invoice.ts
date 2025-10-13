import { Fyo, t } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  CurrenciesMap,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  HiddenMap,
} from 'fyo/model/types';
import { DEFAULT_CURRENCY } from 'fyo/utils/consts';
import { ValidationError } from 'fyo/utils/errors';
import { Transactional } from 'models/Transactional/Transactional';
import {
  addItem,
  canApplyCouponCode,
  canApplyPricingRule,
  createLoyaltyPointEntry,
  filterPricingRules,
  getAddedLPWithGrandTotal,
  getExchangeRate,
  getNumberSeries,
  removeUnusedCoupons,
  getPricingRulesConflicts,
  removeLoyaltyPoint,
  roundFreeItemQty,
  getReturnQtyTotal,
  getReturnLoyaltyPoints,
  getItemQtyMap,
  getItemVisibility,
} from 'models/helpers';
import { StockTransfer } from 'models/inventory/StockTransfer';
import { validateBatch } from 'models/inventory/helpers';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { FieldTypeEnum, Schema } from 'schemas/types';
import { getIsNullOrUndef, joinMapLists, safeParseFloat } from 'utils';
import { Defaults } from '../Defaults/Defaults';
import { InvoiceItem } from '../InvoiceItem/InvoiceItem';
import { Item } from '../Item/Item';
import { Party } from '../Party/Party';
import { Payment } from '../Payment/Payment';
import { Tax } from '../Tax/Tax';
import { TaxSummary } from '../TaxSummary/TaxSummary';
import { ReturnDocItem } from 'models/inventory/types';
import { AccountFieldEnum, PaymentTypeEnum } from '../Payment/types';
import { PricingRule } from '../PricingRule/PricingRule';
import { ApplicablePricingRules } from './types';
import { PricingRuleDetail } from '../PricingRuleDetail/PricingRuleDetail';
import { LoyaltyProgram } from '../LoyaltyProgram/LoyaltyProgram';
import { AppliedCouponCodes } from '../AppliedCouponCodes/AppliedCouponCodes';
import { CouponCode } from '../CouponCode/CouponCode';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';
import { PricingRuleItem } from '../PricingRuleItem/PricingRuleItem';
import { getLinkedEntries } from 'src/utils/doc';

export type TaxDetail = {
  account: string;
  payment_account?: string;
  rate: number;
};

export type ReturnedItemData =
  | number
  | {
      quantity?: number;
      batches?: Record<string, number>;
    };

export type InvoiceTaxItem = {
  details: TaxDetail;
  exchangeRate?: number;
  fullAmount: Money;
  taxAmount: Money;
};

export abstract class Invoice extends Transactional {
  _taxes: Record<string, Tax> = {};
  taxes?: TaxSummary[];

  items?: InvoiceItem[];
  coupons?: AppliedCouponCodes[];
  party?: string;
  account?: string;
  currency?: string;
  priceList?: string;
  netTotal?: Money;
  grandTotal?: Money;
  baseGrandTotal?: Money;
  outstandingAmount?: Money;
  exchangeRate?: number;
  setDiscountAmount?: boolean;
  discountAmount?: Money;
  discountPercent?: number;
  loyaltyPoints?: number;
  discountAfterTax?: boolean;
  stockNotTransferred?: number;
  loyaltyProgram?: string;
  backReference?: string;
  submitted?: boolean;
  cancelled?: boolean;
  makeAutoPayment?: boolean;
  makeAutoStockTransfer?: boolean;

  isReturned?: boolean;
  returnAgainst?: string;
  isFullyReturned?: boolean;

  pricingRuleDetail?: PricingRuleDetail[];

  get isSales() {
    return (
      this.schemaName === 'SalesInvoice' || this.schemaName == 'SalesQuote'
    );
  }

  get isQuote() {
    return this.schemaName == 'SalesQuote';
  }

  get enableDiscounting() {
    return !!this.fyo.singles?.AccountingSettings?.enableDiscounting;
  }

  get isMultiCurrency() {
    if (!this.currency) {
      return false;
    }

    return this.fyo.singles.SystemSettings!.currency !== this.currency;
  }

  get companyCurrency() {
    return this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY;
  }

  get stockTransferSchemaName() {
    return this.isSales
      ? ModelNameEnum.Shipment
      : ModelNameEnum.PurchaseReceipt;
  }

  get hasLinkedTransfers() {
    if (!this.submitted) {
      return false;
    }

    return this.getStockTransferred() > 0;
  }

  get hasLinkedPayments() {
    if (!this.submitted) {
      return false;
    }

    return !this.baseGrandTotal?.eq(this.outstandingAmount!);
  }

  get autoPaymentAccount(): string | null {
    const fieldname = this.isSales
      ? 'salesPaymentAccount'
      : 'purchasePaymentAccount';
    const value = this.fyo.singles.Defaults?.[fieldname];
    if (typeof value === 'string' && value.length) {
      return value;
    }

    return null;
  }

  get autoStockTransferLocation(): string | null {
    const fieldname = this.isSales
      ? 'shipmentLocation'
      : 'purchaseReceiptLocation';
    const value = this.fyo.singles.Defaults?.[fieldname];
    if (typeof value === 'string' && value.length) {
      return value;
    }

    return null;
  }

  get isReturn(): boolean {
    return !!this.returnAgainst;
  }

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);
    this._setGetCurrencies();
  }

  async validate() {
    await super.validate();
    if (this.isQuote) {
      return;
    }
    if (
      this.enableDiscounting &&
      !this.fyo.singles?.AccountingSettings?.discountAccount
    ) {
      throw new ValidationError(this.fyo.t`Discount Account is not set.`);
    }
    await validateBatch(this);
    await this._validatePricingRule();
  }

  async beforeSubmit() {
    const partyDoc = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      this.party
    )) as Party;

    if ((this.loyaltyPoints as number) > (partyDoc?.loyaltyPoints || 0)) {
      throw new ValidationError(
        t`${this.party as string} only has ${
          partyDoc.loyaltyPoints as number
        } points`
      );
    }
  }

  async afterSubmit() {
    await super.afterSubmit();
    if (this.isReturn) {
      await this._removeLoyaltyPointEntry();
      await this._updateIsItemsReturned();
      this.reduceUsedCountOfCoupons();
      await this.updateIsItemsFullyReturned(this);
    }

    if (this.isQuote) {
      return;
    }

    let lpAddedBaseGrandTotal: Money | undefined;

    if (this.redeemLoyaltyPoints) {
      lpAddedBaseGrandTotal = await this.getLPAddedBaseGrandTotal();
    }

    // update outstanding amounts
    await this.fyo.db.update(this.schemaName, {
      name: this.name as string,
      outstandingAmount: lpAddedBaseGrandTotal! || this.baseGrandTotal!,
    });

    const party = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      this.party
    )) as Party;

    await party.updateOutstandingAmount();

    if (this.makeAutoPayment && this.autoPaymentAccount) {
      const payment = this.getPayment();
      await payment?.sync();
      await payment?.submit();
      await this.load();
    }

    if (this.makeAutoStockTransfer && this.autoStockTransferLocation) {
      const stockTransfer = await this.getStockTransfer(true);
      await stockTransfer?.sync();
      await stockTransfer?.submit();
      await this.load();
    }

    await this._updateIsItemsReturned();
    if (!this.isReturn) {
      await this._createLoyaltyPointEntry();
    }

    if (this.schemaName === ModelNameEnum.SalesInvoice) {
      this.updateUsedCountOfCoupons();
    }
  }

  async afterCancel() {
    await super.afterCancel();
    await this._cancelPayments();
    await this._updatePartyOutStanding();
    await this._updateIsItemsReturned();
    await this._removeLoyaltyPointEntry();
    this.reduceUsedCountOfCoupons();
  }

  async _removeLoyaltyPointEntry() {
    await removeLoyaltyPoint(this);
  }

  async _cancelPayments() {
    const paymentIds = await this.getPaymentIds();
    for (const paymentId of paymentIds) {
      const paymentDoc = (await this.fyo.doc.getDoc(
        'Payment',
        paymentId
      )) as Payment;
      await paymentDoc.cancel();
    }
  }

  async _updatePartyOutStanding() {
    const partyDoc = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      this.party
    )) as Party;

    await partyDoc.updateOutstandingAmount();
  }

  async afterDelete() {
    await super.afterDelete();
    const paymentIds = await this.getPaymentIds();
    for (const name of paymentIds) {
      const paymentDoc = await this.fyo.doc.getDoc(ModelNameEnum.Payment, name);
      await paymentDoc.delete();
    }
  }

  async getPaymentIds() {
    const payments = (await this.fyo.db.getAll('PaymentFor', {
      fields: ['parent'],
      filters: { referenceType: this.schemaName, referenceName: this.name! },
      orderBy: 'name',
    })) as { parent: string }[];

    if (payments.length != 0) {
      return [...new Set(payments.map(({ parent }) => parent))];
    }

    return [];
  }

  async getExchangeRate() {
    if (!this.currency) {
      return 1.0;
    }

    const currency = await this.fyo.getValue(
      ModelNameEnum.SystemSettings,
      'currency'
    );
    if (this.currency === currency) {
      return 1.0;
    }
    const exchangeRate = await getExchangeRate({
      fromCurrency: this.currency,
      toCurrency: currency as string,
    });

    return safeParseFloat(exchangeRate.toFixed(2));
  }

  async getTaxItems(): Promise<InvoiceTaxItem[]> {
    const taxItems: InvoiceTaxItem[] = [];
    for (const item of this.items ?? []) {
      if (!item.tax) {
        continue;
      }

      const tax = await this.getTax(item.tax);
      for (const details of (tax.details ?? []) as TaxDetail[]) {
        let amount = item.amount!;

        if (this.isReturn && amount.isPositive()) {
          amount = amount.neg();
        }

        if (!this.discountAfterTax) {
          let itemDiscountAmount = this.getDiscountAmount(item);

          if (this.isReturn && itemDiscountAmount.isNegative()) {
            itemDiscountAmount = itemDiscountAmount.abs();
          }

          if (this.isReturn) {
            amount = amount.add(itemDiscountAmount);
          } else {
            amount = amount.sub(itemDiscountAmount);
          }

          const taxItem: InvoiceTaxItem = {
            details,
            exchangeRate: this.exchangeRate ?? 1,
            fullAmount: amount,
            taxAmount: amount.mul(details.rate / 100),
          };

          taxItems.push(taxItem);
        }
      }
    }

    return taxItems;
  }

  async getTaxSummary() {
    const taxes: Record<
      string,
      {
        account: string;
        rate: number;
        amount: Money;
      }
    > = {};

    for (const { details, taxAmount } of await this.getTaxItems()) {
      const account = details.account;

      taxes[account] ??= {
        account,
        rate: details.rate,
        amount: this.fyo.pesa(0),
      };

      taxes[account].amount = taxes[account].amount.add(taxAmount);
    }

    type Summary = typeof taxes[string] & { idx: number };
    const taxArr: Summary[] = [];
    let idx = 0;
    for (const account in taxes) {
      const tax = taxes[account];
      if (tax.amount.isZero()) {
        continue;
      }

      taxArr.push({
        ...tax,
        idx,
      });
      idx += 1;
    }

    return taxArr;
  }

  async getTotalTax() {
    const taxArr = await this.getTaxSummary();
    return taxArr
      .map(({ amount }) => amount)
      .reduce((a, b) => a.add(b), this.fyo.pesa(0));
  }

  async getTax(tax: string) {
    if (!this._taxes[tax]) {
      this._taxes[tax] = await this.fyo.doc.getDoc('Tax', tax);
    }

    return this._taxes[tax];
  }

  getTotalDiscount() {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    const itemDiscountAmount = this.getItemDiscountAmount();
    const invoiceDiscountAmount = this.getInvoiceDiscountAmount();

    if (
      this.isReturn &&
      itemDiscountAmount.add(invoiceDiscountAmount).isPositive()
    ) {
      return itemDiscountAmount.add(invoiceDiscountAmount).neg();
    }

    return itemDiscountAmount.add(invoiceDiscountAmount);
  }

  getGrandTotal() {
    const totalDiscount = this.getTotalDiscount();

    if (!this.taxes!.length) {
      if (this.redeemLoyaltyPoints) {
        return this.getLPAddedBaseGrandTotal();
      }
      return (this.netTotal as Money).sub(totalDiscount);
    }

    const grandTotal = ((this.taxes ?? []) as Doc[])
      .map((doc) => doc.amount as Money)
      .reduce((a, b) => {
        if (this.isReturn) {
          return a.abs().add(b.abs()).neg();
        }

        return a.add(b.abs());
      }, (this.netTotal as Money).abs())
      .sub(totalDiscount);

    if (this.redeemLoyaltyPoints) {
      return this.getLPAddedBaseGrandTotal();
    }
    return grandTotal;
  }

  getInvoiceDiscountAmount() {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    if (this.setDiscountAmount) {
      return this.discountAmount ?? this.fyo.pesa(0);
    }

    let totalItemAmounts = this.fyo.pesa(0);
    for (const item of this.items ?? []) {
      if (this.discountAfterTax) {
        totalItemAmounts = totalItemAmounts.add(item.itemTaxedTotal!);
      } else {
        totalItemAmounts = totalItemAmounts.add(item.itemDiscountedTotal!);
      }
    }

    return totalItemAmounts.percent(this.discountPercent ?? 0);
  }
  getDiscountAmount(item: InvoiceItem) {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    if (!this?.items?.length) {
      return this.fyo.pesa(0);
    }

    let discountAmount = this.fyo.pesa(0);
    if (item.setItemDiscountAmount) {
      discountAmount = discountAmount.add(
        (item.itemDiscountAmount ?? this.fyo.pesa(0)).mul(
          item.quantity as number
        )
      );
    } else if (!this.discountAfterTax) {
      if (this.isReturn) {
        discountAmount = discountAmount.add(
          (item.amount ?? this.fyo.pesa(0)).mul(
            -Math.abs(item.itemDiscountPercent as number) / 100
          )
        );
      } else {
        discountAmount = discountAmount.add(
          (item.amount ?? this.fyo.pesa(0)).mul(
            (item.itemDiscountPercent ?? 0) / 100
          )
        );
      }
    } else if (this.discountAfterTax) {
      if (this.isReturn) {
        discountAmount = discountAmount.add(
          (item.itemTaxedTotal ?? this.fyo.pesa(0)).mul(
            -Math.abs(item.itemDiscountPercent as number) / 100
          )
        );
      } else {
        discountAmount = discountAmount.add(
          (item.itemTaxedTotal ?? this.fyo.pesa(0)).mul(
            (item.itemDiscountPercent ?? 0) / 100
          )
        );
      }
    }

    if (this.isReturn) {
      return discountAmount.neg();
    }

    return discountAmount;
  }
  getItemDiscountAmount() {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    if (!this?.items?.length) {
      return this.fyo.pesa(0);
    }

    let discountAmount = this.fyo.pesa(0);
    for (const item of this.items) {
      if (item.setItemDiscountAmount) {
        discountAmount = discountAmount.add(
          (item.itemDiscountAmount ?? this.fyo.pesa(0)).mul(
            item.quantity as number
          )
        );
      } else if (!this.discountAfterTax) {
        if (this.isReturn) {
          discountAmount = discountAmount.add(
            (item.amount ?? this.fyo.pesa(0)).mul(
              Math.abs(item.itemDiscountPercent as number) / 100
            )
          );
        } else {
          discountAmount = discountAmount.add(
            (item.amount ?? this.fyo.pesa(0)).mul(
              (item.itemDiscountPercent ?? 0) / 100
            )
          );
        }
      } else if (this.discountAfterTax) {
        if (this.isReturn) {
          discountAmount = discountAmount.add(
            (item.itemTaxedTotal ?? this.fyo.pesa(0)).mul(
              -Math.abs(item.itemDiscountPercent as number) / 100
            )
          );
        } else {
          discountAmount = discountAmount.add(
            (item.itemTaxedTotal ?? this.fyo.pesa(0)).mul(
              (item.itemDiscountPercent ?? 0) / 100
            )
          );
        }
      }
    }

    if (this.isReturn) {
      return discountAmount.neg();
    }

    return discountAmount;
  }
  async getTotalTaxRate(row: InvoiceItem): Promise<number> {
    if (!this.taxes!.length) {
      return 0;
    }

    const details =
      ((await this.fyo.getValue(
        'Tax',
        row.tax as string,
        'details'
      )) as Doc[]) ?? [];
    return details.reduce((acc, doc) => {
      return (doc.rate as number) + acc;
    }, 0);
  }

  async getItemsDiscountedTotal(row: InvoiceItem) {
    const totalTaxRate = await this.getTotalTaxRate(row);
    const rate = row.rate ?? this.fyo.pesa(0);
    const quantity = row.quantity ?? 1;
    const itemDiscountAmount = row.itemDiscountAmount ?? this.fyo.pesa(0);
    const itemDiscountPercent = row.itemDiscountPercent ?? 0;

    if (row.setItemDiscountAmount && row.itemDiscountAmount?.isZero()) {
      return rate.mul(quantity);
    }

    if (!row.setItemDiscountAmount && row.itemDiscountPercent === 0) {
      return rate.mul(quantity);
    }

    if (!this.discountAfterTax) {
      const amount = rate.mul(quantity);
      if (row.setItemDiscountAmount) {
        return amount.sub(itemDiscountAmount);
      }

      return amount.mul(1 - itemDiscountPercent / 100);
    }

    const taxedTotal = rate.mul(quantity).mul(1 + totalTaxRate / 100);
    if (row.setItemDiscountAmount) {
      return taxedTotal.sub(itemDiscountAmount);
    }

    return taxedTotal.mul(1 - itemDiscountPercent / 100);
  }

  async getReturnDoc(): Promise<Invoice | undefined> {
    if (!this.name) {
      return;
    }

    const docData = this.getValidDict(true, true);
    docData.pricingRuleDetail = [];
    const docItems = docData.items as DocValueMap[];

    if (!docItems) {
      return;
    }

    let returnDocItems: DocValueMap[] = [];

    const totalQtyOfReturnedItems: Record<
      string,
      number | { quantity?: number; batches?: Record<string, number> }
    > = await getReturnQtyTotal(this);

    const returnBalanceItemsQty = await this.fyo.db.getReturnBalanceItemsQty(
      this.schemaName,
      this.name
    );

    for (const item of docItems) {
      if (totalQtyOfReturnedItems) {
        if (item.isFreeItem) {
          returnDocItems.push({
            ...item,
            name: undefined,
            quantity: -(item.quantity as number),
            transferQuantity: -(
              (item.quantity as number) / (item.unitConversionFactor as number)
            ),
          });
          continue;
        }
        if (item.batch) {
          const returnData = totalQtyOfReturnedItems[item.item as string];
          if (typeof returnData === 'object' && returnData?.batches) {
            returnDocItems = docItems.map((docItem) => ({
              ...docItem,
              name: undefined,
              quantity: -returnData?.batches![docItem.batch as string] || 0,
            }));
          }
        } else {
          returnDocItems = docItems.map((docItem) => ({
            ...docItem,
            name: undefined,
            quantity: -(totalQtyOfReturnedItems[docItem.item as string] || 0),
            transferQuantity: -(
              (totalQtyOfReturnedItems[docItem.item as string] as number) /
              (item.unitConversionFactor as number)
            ),
          }));
        }

        for (const row of returnDocItems) {
          row.itemDiscountedTotal = await this.getItemsDiscountedTotal(
            row as InvoiceItem
          );
        }
        break;
      }

      const isItemExist = !!returnDocItems.filter(
        (balanceItem) => !item.batch && balanceItem.item === item.item
      ).length;

      if (isItemExist) {
        continue;
      }

      const returnedItem: ReturnDocItem | undefined =
        returnBalanceItemsQty![item.item as string];

      if (!returnedItem) {
        continue;
      }

      let quantity = returnedItem.quantity;
      let transferQuantity = quantity / (item.unitConversionFactor as number);

      let serialNumber: string | undefined =
        returnedItem.serialNumbers?.join('\n');

      if (
        item.batch &&
        returnedItem.batches &&
        returnedItem.batches[item.batch as string]
      ) {
        if (returnedItem.batches[item.batch as string].serialNumbers) {
          serialNumber =
            returnedItem.batches[item.batch as string].serialNumbers?.join(
              '\n'
            );
        }
        const returnedItemsData = totalQtyOfReturnedItems[
          item.item as string
        ] as ReturnedItemData;

        if (
          typeof returnedItemsData === 'object' &&
          returnedItemsData.batches
        ) {
          quantity = -returnedItemsData?.batches[item.batch as string];
          transferQuantity = quantity / (item.unitConversionFactor as number);
        }
      }

      returnDocItems.push({
        ...item,
        serialNumber,
        name: undefined,
        quantity: quantity,
        transferQuantity,
      });
    }

    returnDocItems = returnDocItems.filter(
      (docItems) => (docItems.quantity as number) < 0
    );

    const returnDocData = {
      ...docData,
      name: undefined,
      date: new Date(),
      items: returnDocItems,
      returnAgainst: docData.name,
    } as DocValueMap;

    const newReturnDoc = this.fyo.doc.getNewDoc(
      this.schema.name,
      returnDocData
    ) as Invoice;

    await newReturnDoc.runFormulas();
    return newReturnDoc;
  }

  updateUsedCountOfCoupons() {
    this.coupons?.map(async (coupon) => {
      const couponDoc = await this.fyo.doc.getDoc(
        ModelNameEnum.CouponCode,
        coupon.coupons
      );

      await couponDoc.setAndSync({ used: (couponDoc.used as number) + 1 });
    });
  }
  reduceUsedCountOfCoupons() {
    if (!this.coupons?.length) {
      return;
    }

    this.coupons?.map(async (coupon) => {
      const couponDoc = await this.fyo.doc.getDoc(
        ModelNameEnum.CouponCode,
        coupon.coupons
      );

      await couponDoc.setAndSync({ used: (couponDoc.used as number) - 1 });
    });
  }

  async updateIsItemsFullyReturned(doc?: Invoice) {
    if (!doc?.returnAgainst || doc.schemaName !== ModelNameEnum.SalesInvoice) {
      return;
    }

    const sinvDoc = await this.fyo.doc.getDoc(
      ModelNameEnum.SalesInvoice,
      doc.returnAgainst
    );

    const totalQtyOfReturnedItems = await getReturnQtyTotal(
      (sinvDoc as Invoice) ?? this
    );
    const isFullyReturned = Object.values(totalQtyOfReturnedItems).every(
      (value) =>
        typeof value === 'number' ? value === 0 : value?.quantity === 0
    );
    if (!isFullyReturned) {
      return;
    }
    const invoiceDoc = await this.fyo.doc.getDoc(
      this.schemaName,
      this.returnAgainst
    );
    await invoiceDoc.setAndSync({ isFullyReturned });
    await invoiceDoc.submit();
  }

  async _updateIsItemsReturned() {
    if (!this.isReturn || !this.returnAgainst || this.isQuote) {
      return;
    }

    const returnInvoices = await this.fyo.db.getAll(this.schema.name, {
      filters: {
        submitted: true,
        cancelled: false,
        returnAgainst: this.returnAgainst,
      },
    });

    const isReturned = !!returnInvoices.length;
    const invoiceDoc = await this.fyo.doc.getDoc(
      this.schemaName,
      this.returnAgainst
    );
    await invoiceDoc.setAndSync({ isReturned });
    await invoiceDoc.submit();
  }

  async _createLoyaltyPointEntry() {
    if (!this.loyaltyProgram) {
      return;
    }

    const loyaltyProgramDoc = (await this.fyo.doc.getDoc(
      ModelNameEnum.LoyaltyProgram,
      this.loyaltyProgram
    )) as LoyaltyProgram;

    const expiryDate = this.date as Date;
    const fromDate = loyaltyProgramDoc.fromDate as Date;
    const toDate = loyaltyProgramDoc.toDate as Date;

    if (fromDate <= expiryDate && toDate >= expiryDate) {
      const party = (await this.loadAndGetLink('party')) as Party;

      await createLoyaltyPointEntry(this);
      await party.updateLoyaltyPoints();
    }
  }

  async _validateHasLinkedReturnInvoices() {
    if (!this.name || this.isReturn || this.isQuote) {
      return;
    }

    const returnInvoices = await this.fyo.db.getAll(this.schemaName, {
      filters: {
        returnAgainst: this.name,
      },
    });

    if (!returnInvoices.length) {
      return;
    }

    const names = returnInvoices.map(({ name }) => name).join(', ');
    throw new ValidationError(
      this.fyo
        .t`Cannot cancel ${this.name} because of the following ${this.schema.label}: ${names}`
    );
  }

  async getLPAddedBaseGrandTotal() {
    const totalDiscount = this.getTotalDiscount();

    let baseTotal: Money;

    if (!this.taxes?.length) {
      baseTotal = (this.netTotal as Money).sub(totalDiscount);
    } else {
      baseTotal = this.taxes
        .map((doc) => doc.amount as Money)
        .reduce((a, b) => a.add(b.abs()), (this.netTotal as Money).abs())
        .sub(totalDiscount);
    }
    if (!this.isReturn) {
      const totalLoyaltyAmount = await getAddedLPWithGrandTotal(
        this.fyo,
        this.loyaltyProgram as string,
        this.loyaltyPoints as number
      );

      return baseTotal.sub(totalLoyaltyAmount);
    }

    if (this.isReturn) {
      const loyaltyAmount = await getReturnLoyaltyPoints(this);

      const totalAmount = baseTotal.abs().sub(loyaltyAmount);

      this.loyaltyPoints = loyaltyAmount;
      if (totalAmount.isNegative()) {
        this.loyaltyPoints = totalAmount.abs().float - Math.abs(loyaltyAmount);
        return this.fyo.pesa(0);
      }

      return baseTotal.abs().sub(loyaltyAmount);
    }

    return baseTotal;
  }

  formulas: FormulaMap = {
    account: {
      formula: async () => {
        return (await this.fyo.getValue(
          'Party',
          this.party!,
          'defaultAccount'
        )) as string;
      },
      dependsOn: ['party'],
    },
    loyaltyProgram: {
      formula: async () => {
        const partyDoc = await this.fyo.doc.getDoc(
          ModelNameEnum.Party,
          this.party
        );
        return partyDoc?.loyaltyProgram as string;
      },
      dependsOn: ['party', 'name'],
    },
    currency: {
      formula: async () => {
        const currency = (await this.fyo.getValue(
          'Party',
          this.party!,
          'currency'
        )) as string;

        if (!getIsNullOrUndef(currency)) {
          return currency;
        }
        return this.fyo.singles.SystemSettings!.currency as string;
      },
      dependsOn: ['party'],
    },
    exchangeRate: {
      formula: async () => {
        if (
          this.currency ===
          (this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY)
        ) {
          return 1;
        }

        if (this.exchangeRate && this.exchangeRate !== 1) {
          return this.exchangeRate;
        }

        return await this.getExchangeRate();
      },
      dependsOn: ['party', 'currency'],
    },
    netTotal: { formula: () => this.getSum('items', 'amount', false) },
    taxes: { formula: async () => await this.getTaxSummary() },
    grandTotal: {
      formula: async () => await this.getGrandTotal(),
      dependsOn: ['loyaltyPoints'],
    },
    baseGrandTotal: {
      formula: () => (this.grandTotal as Money).mul(this.exchangeRate! ?? 1),
      dependsOn: ['grandTotal', 'exchangeRate'],
    },
    outstandingAmount: {
      formula: async () => {
        if (this.submitted) {
          return;
        }
        if (this.isReturn) {
          const sinvreturnedDoc = (await this.fyo.doc.getDoc(
            this.schemaName,
            this.returnAgainst
          )) as Invoice;
          if (sinvreturnedDoc.outstandingAmount?.isZero()) {
            return this.grandTotal?.abs();
          } else {
            const totalPaid = sinvreturnedDoc
              .grandTotal!.abs()
              .sub(sinvreturnedDoc.outstandingAmount!);

            const outstandingAmount = this.grandTotal!.abs();

            return outstandingAmount.lte(totalPaid)
              ? outstandingAmount
              : totalPaid;
          }
        }

        return this.baseGrandTotal;
      },
      dependsOn: ['discountAmount', 'discountPercent'],
    },
    stockNotTransferred: {
      formula: async () => {
        if (this.submitted) {
          return;
        }
        if (this.isReturn) {
          const sinvreturnedDoc = (await this.fyo.doc.getDoc(
            this.schemaName,
            this.returnAgainst
          )) as Invoice;

          if (sinvreturnedDoc.stockNotTransferred === 0) {
            return this.getStockNotTransferred();
          } else {
            return 0;
          }
        }

        return this.getStockNotTransferred();
      },
      dependsOn: ['items'],
    },
    makeAutoPayment: {
      formula: () => !!this.autoPaymentAccount,
      dependsOn: [],
    },
    makeAutoStockTransfer: {
      formula: () =>
        !!this.fyo.singles.AccountingSettings?.enableInventory &&
        !!this.autoStockTransferLocation,
      dependsOn: [],
    },
    isPricingRuleApplied: {
      formula: async () => {
        if (!this.fyo.singles.AccountingSettings?.enablePricingRule) {
          return false;
        }

        const pricingRule = await this.getPricingRule();

        if (pricingRule) {
          await this.appendPricingRuleDetail(pricingRule);
          return !!pricingRule;
        } else {
          this.pricingRuleDetail = [];
          return false;
        }
      },
      dependsOn: ['items', 'coupons'],
    },
  };

  getStockTransferred() {
    return (this.items ?? []).reduce(
      (acc, item) =>
        (item.quantity ?? 0) - (item.stockNotTransferred ?? 0) + acc,
      0
    );
  }

  getTotalQuantity() {
    return (this.items ?? []).reduce(
      (acc, item) => acc + (item.quantity ?? 0),
      0
    );
  }

  getStockNotTransferred() {
    return (this.items ?? []).reduce(
      (acc, item) => (item.stockNotTransferred ?? 0) + acc,
      0
    );
  }

  getItemDiscountedAmounts() {
    let itemDiscountedAmounts = this.fyo.pesa(0);
    for (const item of this.items ?? []) {
      itemDiscountedAmounts = itemDiscountedAmounts.add(
        item.itemDiscountedTotal ?? item.amount!
      );
    }
    return itemDiscountedAmounts;
  }

  hidden: HiddenMap = {
    makeAutoPayment: () => {
      if (this.submitted) {
        return true;
      }

      return !this.autoPaymentAccount;
    },
    makeAutoStockTransfer: () => {
      if (this.submitted) {
        return true;
      }

      if (!this.fyo.singles.AccountingSettings?.enableInventory) {
        return true;
      }

      return !this.autoStockTransferLocation;
    },
    setDiscountAmount: () => true || !this.enableDiscounting,
    discountAmount: () =>
      true || !(this.enableDiscounting && !!this.setDiscountAmount),
    discountPercent: () =>
      true || !(this.enableDiscounting && !this.setDiscountAmount),
    discountAfterTax: () => !this.enableDiscounting,
    taxes: () => !this.taxes?.length,
    baseGrandTotal: () =>
      this.exchangeRate === 1 || this.baseGrandTotal!.isZero(),
    terms: () => !(this.terms || !(this.isSubmitted || this.isCancelled)),
    attachment: () =>
      !(this.attachment || !(this.isSubmitted || this.isCancelled)),
    backReference: () => !this.backReference,
    quote: () => !this.quote,
    loyaltyProgram: () => !this.loyaltyProgram,
    loyaltyPoints: () => !this.redeemLoyaltyPoints || this.isReturn,
    redeemLoyaltyPoints: () => !this.loyaltyProgram || this.isReturn,
    coupons: () => this.isSubmitted && !this.coupons?.length,
    priceList: () =>
      !this.fyo.singles.AccountingSettings?.enablePriceList ||
      (!this.canEdit && !this.priceList),
    returnAgainst: () =>
      (this.isSubmitted || this.isCancelled) && !this.returnAgainst,
    pricingRuleDetail: () =>
      !this.fyo.singles.AccountingSettings?.enablePricingRule ||
      !this.pricingRuleDetail?.length,
  };

  static defaults: DefaultMap = {
    makeAutoPayment: (doc) =>
      doc instanceof Invoice && !!doc.autoPaymentAccount,
    makeAutoStockTransfer: (doc) =>
      !!doc.fyo.singles.AccountingSettings?.enableInventory &&
      doc instanceof Invoice &&
      !!doc.autoStockTransferLocation,
    numberSeries: (doc) => getNumberSeries(doc.schemaName, doc.fyo),
    terms: (doc) => {
      const defaults = doc.fyo.singles.Defaults;
      if (doc.schemaName === ModelNameEnum.SalesInvoice) {
        return defaults?.salesInvoiceTerms ?? '';
      }

      return defaults?.purchaseInvoiceTerms ?? '';
    },
    date: () => new Date(),
  };

  static filters: FiltersMap = {
    party: (doc: Doc) => ({
      role: ['in', [doc.isSales ? 'Customer' : 'Supplier', 'Both']],
    }),
    account: (doc: Doc) => ({
      isGroup: false,
      accountType: doc.isSales ? 'Receivable' : 'Payable',
    }),
    numberSeries: (doc: Doc) => ({ referenceType: doc.schemaName }),
    priceList: (doc: Doc) => ({
      isEnabled: true,
      ...(doc.isSales ? { isSales: true } : { isPurchase: true }),
    }),
  };

  static createFilters: FiltersMap = {
    party: (doc: Doc) => ({
      role: doc.isSales ? 'Customer' : 'Supplier',
    }),
  };

  getCurrencies: CurrenciesMap = {
    baseGrandTotal: () => this.companyCurrency,
    outstandingAmount: () => this.companyCurrency,
  };
  _getCurrency() {
    if (this.exchangeRate === 1) {
      return this.companyCurrency;
    }

    return this.currency ?? DEFAULT_CURRENCY;
  }
  _setGetCurrencies() {
    const currencyFields = this.schema.fields.filter(
      ({ fieldtype }) => fieldtype === FieldTypeEnum.Currency
    );

    for (const { fieldname } of currencyFields) {
      this.getCurrencies[fieldname] ??= this._getCurrency.bind(this);
    }
  }

  getPayment(): Payment | null {
    if (!this.isSubmitted) {
      return null;
    }

    const outstandingAmount = this.outstandingAmount;
    if (!outstandingAmount) {
      return null;
    }

    if (this.outstandingAmount?.isZero()) {
      return null;
    }

    let accountField: AccountFieldEnum = AccountFieldEnum.Account;
    let paymentType: PaymentTypeEnum = PaymentTypeEnum.Receive;
    let referenceType: 'SalesInvoice' | 'PurchaseInvoice';

    if (this.isSales) {
      referenceType = 'SalesInvoice';
      if (this.isReturn) {
        accountField = AccountFieldEnum.PaymentAccount;
        paymentType = PaymentTypeEnum.Pay;
      }
    } else {
      referenceType = 'PurchaseInvoice';
      accountField = AccountFieldEnum.PaymentAccount;
      paymentType = PaymentTypeEnum.Pay;

      if (this.isReturn) {
        accountField = AccountFieldEnum.Account;
        paymentType = PaymentTypeEnum.Receive;
      }
    }
    const paymentAmount = this.isReturn
      ? outstandingAmount
      : outstandingAmount?.abs();

    const data = {
      party: this.party,
      date: new Date().toISOString(),
      paymentType,
      amount: paymentAmount,
      [accountField]: this.account,
      referenceType,
      for: [
        {
          referenceType: this.schemaName,
          referenceName: this.name,
          amount: this.isReturn ? this.grandTotal : outstandingAmount,
        },
      ],
    };

    if (this.makeAutoPayment && this.autoPaymentAccount) {
      const autoPaymentAccount = this.isSales ? 'paymentAccount' : 'account';
      data[autoPaymentAccount] = this.autoPaymentAccount;
    }

    return this.fyo.doc.getNewDoc(ModelNameEnum.Payment, data) as Payment;
  }
  async getStockTransfer(isAuto = false): Promise<StockTransfer | null> {
    if (!this.isSubmitted) {
      return null;
    }

    let linkedEntries;

    if (this.returnAgainst) {
      const sinvDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        this.returnAgainst
      )) as SalesInvoice;

      linkedEntries = await getLinkedEntries(sinvDoc);
    }

    const itemVisibility = await getItemVisibility(this.fyo);

    if (!this.stockNotTransferred && itemVisibility === 'Inventory Items') {
      return null;
    }

    const schemaName = this.stockTransferSchemaName;
    const defaults = (this.fyo.singles.Defaults as Defaults) ?? {};
    let terms;
    let numberSeries;

    if (this.isSales) {
      terms = defaults.shipmentTerms ?? '';
      numberSeries = defaults.shipmentNumberSeries ?? undefined;
    } else {
      terms = defaults.purchaseReceiptTerms ?? '';
      numberSeries = defaults.purchaseReceiptNumberSeries ?? undefined;
    }

    const data = {
      party: this.party,
      date: new Date().toISOString(),
      terms,
      numberSeries,
      backReference: this.name,
      returnAgainst: linkedEntries ? linkedEntries.Shipment![0] : '',
    };

    let location = this.autoStockTransferLocation;
    if (!location) {
      location = this.fyo.singles.InventorySettings?.defaultLocation ?? null;
    }

    if (isAuto && !location) {
      return null;
    }

    const transfer = this.fyo.doc.getNewDoc(schemaName, data) as StockTransfer;

    for (const row of this.items ?? []) {
      if (!row.item) {
        continue;
      }

      const itemDoc = (await row.loadAndGetLink('item')) as Item;
      if (isAuto && (itemDoc.hasBatch || itemDoc.hasSerialNumber)) {
        continue;
      }

      const isFreeItem = row.isFreeItem ?? false;
      if (isFreeItem) {
        await transfer.append('items', {
          item: row.item,
          quantity: row.quantity,
          location,
          rate: this.fyo.pesa(0),
          batch: row.batch || null,
          description: row.description,
          hsnCode: row.hsnCode,
          isFreeItem,
        });
        continue;
      }

      let quantity;
      if (itemDoc.trackItem) {
        quantity = row.stockNotTransferred;
      } else {
        quantity = row.quantity;
      }

      const item = row.item;
      const batch = row.batch || null;
      const description = row.description;
      const hsnCode = row.hsnCode;
      let rate = row.rate as Money;

      if (this.exchangeRate && this.exchangeRate > 1) {
        rate = rate.mul(this.exchangeRate);
      }

      if (!quantity && itemVisibility === 'Inventory Items') {
        continue;
      }

      if (isAuto) {
        const stock =
          (await this.fyo.db.getStockQuantity(
            item,
            location!,
            undefined,
            data.date
          )) ?? 0;

        if (stock < (quantity as number)) {
          continue;
        }
      }

      await transfer.append('items', {
        item,
        quantity,
        location,
        rate,
        batch,
        description,
        hsnCode,
      });
    }

    if (!transfer.items?.length) {
      return null;
    }

    return transfer;
  }

  async beforeSync(): Promise<void> {
    await super.beforeSync();

    if (this.pricingRuleDetail?.length) {
      await this.applyProductDiscount();
    } else {
      this.clearFreeItems();
    }

    await removeUnusedCoupons(this as SalesInvoice);
  }

  async beforeCancel(): Promise<void> {
    await super.beforeCancel();
    await this._validateStockTransferCancelled();
    await this._validateHasLinkedReturnInvoices();
  }

  async beforeDelete(): Promise<void> {
    await super.beforeCancel();
    await this._validateStockTransferCancelled();
    await this._deleteCancelledStockTransfers();
  }

  async _deleteCancelledStockTransfers() {
    const schemaName = this.stockTransferSchemaName;
    const transfers = await this._getLinkedStockTransferNames(true);

    for (const { name } of transfers) {
      const st = await this.fyo.doc.getDoc(schemaName, name);
      await st.delete();
    }
  }

  async _validateStockTransferCancelled() {
    const schemaName = this.stockTransferSchemaName;
    const transfers = await this._getLinkedStockTransferNames(false);
    if (!transfers?.length) {
      return;
    }

    const names = transfers.map(({ name }) => name).join(', ');
    const label = this.fyo.schemaMap[schemaName]?.label ?? schemaName;
    throw new ValidationError(
      this.fyo.t`Cannot cancel ${this.schema.label} ${this
        .name!} because of the following ${label}: ${names}`
    );
  }

  async _getLinkedStockTransferNames(cancelled: boolean) {
    const name = this.name;
    if (!name) {
      throw new ValidationError(`Name not found for ${this.schema.label}`);
    }

    const schemaName = this.stockTransferSchemaName;
    const transfers = (await this.fyo.db.getAllRaw(schemaName, {
      fields: ['name'],
      filters: { backReference: this.name!, cancelled },
    })) as { name: string }[];
    return transfers;
  }

  async getLinkedPayments() {
    if (!this.hasLinkedPayments) {
      return [];
    }

    const paymentFors = (await this.fyo.db.getAllRaw('PaymentFor', {
      fields: ['parent', 'amount'],
      filters: { referenceName: this.name!, referenceType: this.schemaName },
    })) as { parent: string; amount: string }[];

    const payments = (await this.fyo.db.getAllRaw('Payment', {
      fields: ['name', 'date', 'submitted', 'cancelled'],
      filters: { name: ['in', paymentFors.map((p) => p.parent)] },
    })) as {
      name: string;
      date: string;
      submitted: number;
      cancelled: number;
    }[];

    return joinMapLists(payments, paymentFors, 'name', 'parent')
      .map((j) => ({
        name: j.name,
        date: new Date(j.date),
        submitted: !!j.submitted,
        cancelled: !!j.cancelled,
        amount: this.fyo.pesa(j.amount),
      }))
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }

  async getLinkedStockTransfers() {
    if (!this.hasLinkedTransfers) {
      return [];
    }

    const schemaName = this.stockTransferSchemaName;
    const transfers = (await this.fyo.db.getAllRaw(schemaName, {
      fields: ['name', 'date', 'submitted', 'cancelled'],
      filters: { backReference: this.name! },
    })) as {
      name: string;
      date: string;
      submitted: number;
      cancelled: number;
    }[];

    const itemSchemaName = schemaName + 'Item';
    const transferItems = (await this.fyo.db.getAllRaw(itemSchemaName, {
      fields: ['parent', 'quantity', 'location', 'amount'],
      filters: {
        parent: ['in', transfers.map((t) => t.name)],
        item: ['in', this.items!.map((i) => i.item!)],
      },
    })) as {
      parent: string;
      quantity: number;
      location: string;
      amount: string;
    }[];

    return joinMapLists(transfers, transferItems, 'name', 'parent')
      .map((j) => ({
        name: j.name,
        date: new Date(j.date),
        submitted: !!j.submitted,
        cancelled: !!j.cancelled,
        amount: this.fyo.pesa(j.amount),
        location: j.location,
        quantity: j.quantity,
      }))
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }

  async addItem(name: string) {
    return await addItem(name, this);
  }

  async appendPricingRuleDetail(
    applicablePricingRule: ApplicablePricingRules[]
  ) {
    await this.set('pricingRuleDetail', null);

    for (const doc of applicablePricingRule) {
      await this.append('pricingRuleDetail', {
        referenceName: doc.pricingRule.name,
        referenceItem: doc.applyOnItem,
      });
    }
  }

  clearFreeItems() {
    if (this.pricingRuleDetail?.length || !this.items || this.isReturn) {
      return;
    }

    for (const item of this.items) {
      if (item.isFreeItem) {
        this.items = this.items?.filter(
          (invoiceItem) => invoiceItem.name !== item.name
        );
      }
    }
  }

  async applyProductDiscount() {
    if (!this.items || (await this.ignorePricingRules())) {
      return;
    }

    if (!this.isReturn) {
      this.items = this.items.filter((item) => !item.isFreeItem);
    }

    for (const item of this.items) {
      const pricingRuleDetailForItem = this.pricingRuleDetail?.filter(
        (doc) => doc.referenceItem === item.item
      );

      if (!pricingRuleDetailForItem?.length) {
        continue;
      }

      const pricingRuleDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.PricingRule,
        pricingRuleDetailForItem[0].referenceName
      )) as PricingRule;

      if (pricingRuleDoc.discountType === 'Price Discount') {
        continue;
      }

      const appliedItems = pricingRuleDoc.appliedItems?.map((doc) => doc.item);
      if (!appliedItems?.includes(item.item)) {
        continue;
      }

      const canApplyPRLOnItem = canApplyPricingRule(
        pricingRuleDoc,
        this.date as Date,
        item.quantity as number,
        item.amount as Money
      );

      if (!canApplyPRLOnItem) {
        continue;
      }

      let roundFreeItemQuantity = pricingRuleDoc.freeItemQuantity as number;

      if (pricingRuleDoc.isRecursive) {
        roundFreeItemQuantity =
          (item.quantity as number) / (pricingRuleDoc.recurseEvery as number);
      }

      if (pricingRuleDoc.roundFreeItemQty) {
        roundFreeItemQuantity = roundFreeItemQty(
          roundFreeItemQuantity,
          'floor'
        );
      }

      if (roundFreeItemQuantity <= 0) {
        throw new ValidationError(
          t`Free item "${
            pricingRuleDoc.freeItem as string
          }" was not added due to zero
           quantity`
        );
      }

      const freeItem = pricingRuleDoc.freeItem as string;
      const itemQtyMap = await getItemQtyMap(this as SalesInvoice);
      const availableQty = itemQtyMap[freeItem]?.availableQty ?? 0;

      if (availableQty < roundFreeItemQuantity) {
        continue;
      }

      await this.append('items', {
        item: freeItem,
        quantity: roundFreeItemQuantity,
        isFreeItem: true,
        pricingRule: pricingRuleDoc.title,
        unit: pricingRuleDoc.freeItemUnit,
      });
    }
  }

  async ignorePricingRules(): Promise<boolean> {
    const posProfileName = this.fyo.singles.POSSettings?.posProfile as string;

    if (posProfileName) {
      const posProfile = await this.fyo.doc.getDoc(
        ModelNameEnum.POSProfile,
        posProfileName
      );

      if (posProfile) {
        return posProfile.ignorePricingRule as boolean;
      }
    }

    return !!this.fyo.singles.POSSettings?.ignorePricingRule;
  }

  async getPricingRuleDocNames(
    item: SalesInvoiceItem,
    sinvDoc: SalesInvoice
  ): Promise<string[]> {
    const docs = (await sinvDoc.fyo.db.getAll(ModelNameEnum.PricingRuleItem, {
      fields: ['parent'],
      filters: {
        item: item.item as string,
        unit: item.unit as string,
      },
    })) as PricingRuleItem[];

    return docs.map((doc) => doc.parent) as string[];
  }

  async getPricingRule(): Promise<ApplicablePricingRules[] | undefined> {
    if (await this.ignorePricingRules()) {
      return;
    }
    if (!this.isSales || !this.items) {
      return;
    }

    const pricingRules: ApplicablePricingRules[] = [];

    for (const item of this.items) {
      if (item.isFreeItem) {
        continue;
      }

      const duplicatePricingRule = this.pricingRuleDetail?.filter(
        (pricingrule: PricingRuleDetail) =>
          pricingrule.referenceItem == item.item
      );

      if (duplicatePricingRule && duplicatePricingRule?.length >= 2) {
        continue;
      }

      const pricingRuleDocNames = await this.getPricingRuleDocNames(
        item,
        this as SalesInvoice
      );

      if (!pricingRuleDocNames.length) {
        continue;
      }

      if (this.coupons?.length) {
        for (const coupon of this.coupons) {
          const couponCodeDatas = await this.fyo.db.getAll(
            ModelNameEnum.CouponCode,
            {
              fields: ['*'],
              filters: {
                name: coupon?.coupons as string,
                isEnabled: true,
              },
            }
          );

          const couponPricingRuleDocNames = couponCodeDatas
            .map((doc) => doc.pricingRule)
            .filter((val) =>
              pricingRuleDocNames.includes(val as string)
            ) as string[];

          if (!couponPricingRuleDocNames.length) {
            continue;
          }

          const filtered = canApplyCouponCode(
            couponCodeDatas[0] as CouponCode,
            this.grandTotal as Money,
            this.date as Date
          );

          if (filtered) {
            pricingRuleDocNames.push(...couponPricingRuleDocNames);
          }
        }
      }

      const pricingRuleDocsForItem = (await this.fyo.db.getAll(
        ModelNameEnum.PricingRule,
        {
          fields: ['*'],
          filters: {
            name: ['in', pricingRuleDocNames],
            isEnabled: true,
          },
          orderBy: 'priority',
          order: 'desc',
        }
      )) as PricingRule[];

      if (
        pricingRuleDocsForItem.length &&
        pricingRuleDocsForItem[0].isCouponCodeBased
      ) {
        if (!this.coupons?.length) {
          continue;
        }

        const data = await Promise.allSettled(
          this.coupons?.map(async (val) => {
            if (!val.coupons) {
              return false;
            }

            const [pricingRule] = (
              await this.fyo.db.getAll(ModelNameEnum.CouponCode, {
                fields: ['pricingRule'],
                filters: {
                  name: val?.coupons,
                },
              })
            ).map((doc) => doc.pricingRule);

            if (!pricingRule) {
              return false;
            }

            if (pricingRuleDocsForItem[0].name === pricingRule) {
              return pricingRule;
            }

            return false;
          })
        );

        const fulfilledData = data
          .filter(
            (result): result is PromiseFulfilledResult<string | false> =>
              result.status === 'fulfilled'
          )
          .map((result) => result.value as string);

        if (!fulfilledData[0] && !fulfilledData.filter((val) => val).length) {
          continue;
        }
      }

      const docItem = await this.fyo.doc.getDoc(ModelNameEnum.Item, item.item);

      const totalAmount = (docItem.rate as Money).mul(item.quantity as number);

      const filtered = filterPricingRules(
        this as SalesInvoice,
        pricingRuleDocsForItem,
        item.quantity as number,
        totalAmount
      );

      if (!filtered || !filtered.length) {
        continue;
      }

      const isPricingRuleHasConflicts = getPricingRulesConflicts(filtered);

      if (isPricingRuleHasConflicts) {
        continue;
      }

      pricingRules.push({
        applyOnItem: item.item as string,
        pricingRule: filtered[0],
      });
    }

    return pricingRules;
  }

  async _validatePricingRule() {
    if (!this.fyo.singles.AccountingSettings?.enablePricingRule) {
      return;
    }

    if (!this.items) {
      return;
    }
    await this.getPricingRule();
  }
}
