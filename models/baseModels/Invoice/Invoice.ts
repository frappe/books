import { Fyo } from 'fyo';
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
import { addItem, getExchangeRate, getNumberSeries } from 'models/helpers';
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

export type TaxDetail = {
  account: string;
  payment_account?: string;
  rate: number;
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
  discountAfterTax?: boolean;
  stockNotTransferred?: number;
  backReference?: string;

  submitted?: boolean;
  cancelled?: boolean;
  makeAutoPayment?: boolean;
  makeAutoStockTransfer?: boolean;

  isReturned?: boolean;
  returnAgainst?: string;

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
    if (
      this.enableDiscounting &&
      !this.fyo.singles?.AccountingSettings?.discountAccount
    ) {
      throw new ValidationError(this.fyo.t`Discount Account is not set.`);
    }
    await validateBatch(this);
  }

  async afterSubmit() {
    await super.afterSubmit();

    // update outstanding amounts
    await this.fyo.db.update(this.schemaName, {
      name: this.name as string,
      outstandingAmount: this.baseGrandTotal!,
    });

    const party = (await this.fyo.doc.getDoc('Party', this.party)) as Party;
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
  }

  async afterCancel() {
    await super.afterCancel();
    await this._cancelPayments();
    await this._updatePartyOutStanding();
    await this._updateIsItemsReturned();
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
        if (
          this.enableDiscounting &&
          !this.discountAfterTax &&
          !item.itemDiscountedTotal?.isZero()
        ) {
          amount = item.itemDiscountedTotal!;
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
    return itemDiscountAmount.add(invoiceDiscountAmount);
  }

  getGrandTotal() {
    const totalDiscount = this.getTotalDiscount();
    return ((this.taxes ?? []) as Doc[])
      .map((doc) => doc.amount as Money)
      .reduce((a, b) => a.add(b), this.netTotal!)
      .sub(totalDiscount);
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
          item.itemDiscountAmount ?? this.fyo.pesa(0)
        );
      } else if (!this.discountAfterTax) {
        discountAmount = discountAmount.add(
          (item.amount ?? this.fyo.pesa(0)).mul(
            (item.itemDiscountPercent ?? 0) / 100
          )
        );
      } else if (this.discountAfterTax) {
        discountAmount = discountAmount.add(
          (item.itemTaxedTotal ?? this.fyo.pesa(0)).mul(
            (item.itemDiscountPercent ?? 0) / 100
          )
        );
      }
    }

    return discountAmount;
  }

  async getReturnDoc(): Promise<Invoice | undefined> {
    if (!this.name) {
      return;
    }

    const docData = this.getValidDict(true, true);
    const docItems = docData.items as DocValueMap[];

    if (!docItems) {
      return;
    }

    let returnDocItems: DocValueMap[] = [];

    const returnBalanceItemsQty = await this.fyo.db.getReturnBalanceItemsQty(
      this.schemaName,
      this.name
    );

    for (const item of docItems) {
      if (!returnBalanceItemsQty) {
        returnDocItems = docItems;
        returnDocItems.map((row) => {
          row.name = undefined;
          (row.quantity as number) *= -1;
          return row;
        });
        break;
      }

      const isItemExist = !!returnDocItems.filter(
        (balanceItem) => balanceItem.item === item.item
      ).length;

      if (isItemExist) {
        continue;
      }

      const returnedItem: ReturnDocItem | undefined =
        returnBalanceItemsQty[item.item as string];

      let quantity = returnedItem.quantity;
      let serialNumber: string | undefined =
        returnedItem.serialNumbers?.join('\n');

      if (
        item.batch &&
        returnedItem.batches &&
        returnedItem.batches[item.batch as string]
      ) {
        quantity = returnedItem.batches[item.batch as string].quantity;

        if (returnedItem.batches[item.batch as string].serialNumbers) {
          serialNumber =
            returnedItem.batches[item.batch as string].serialNumbers?.join(
              '\n'
            );
        }
      }

      returnDocItems.push({
        ...item,
        serialNumber,
        name: undefined,
        quantity: quantity,
      });
    }
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
    grandTotal: { formula: () => this.getGrandTotal() },
    baseGrandTotal: {
      formula: () => (this.grandTotal as Money).mul(this.exchangeRate! ?? 1),
      dependsOn: ['grandTotal', 'exchangeRate'],
    },
    outstandingAmount: {
      formula: () => {
        if (this.submitted) {
          return;
        }

        return this.baseGrandTotal!;
      },
    },
    stockNotTransferred: {
      formula: () => {
        if (this.submitted) {
          return;
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
    grandTotal: () => !this.taxes?.length,
    stockNotTransferred: () => !this.stockNotTransferred,
    outstandingAmount: () =>
      !!this.outstandingAmount?.isZero() || !this.isSubmitted,
    terms: () => !(this.terms || !(this.isSubmitted || this.isCancelled)),
    attachment: () =>
      !(this.attachment || !(this.isSubmitted || this.isCancelled)),
    backReference: () => !this.backReference,
    quote: () => !this.quote,
    priceList: () =>
      !this.fyo.singles.AccountingSettings?.enablePriceList ||
      (!this.canEdit && !this.priceList),
    returnAgainst: () =>
      (this.isSubmitted || this.isCancelled) && !this.returnAgainst,
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

    if (this.isSales && this.isReturn) {
      accountField = AccountFieldEnum.PaymentAccount;
      paymentType = PaymentTypeEnum.Pay;
    }

    if (!this.isSales) {
      accountField = AccountFieldEnum.PaymentAccount;
      paymentType = PaymentTypeEnum.Pay;

      if (this.isReturn) {
        accountField = AccountFieldEnum.Account;
        paymentType = PaymentTypeEnum.Receive;
      }
    }

    const data = {
      party: this.party,
      date: new Date().toISOString().slice(0, 10),
      paymentType,
      amount: this.outstandingAmount?.abs(),
      [accountField]: this.account,
      for: [
        {
          referenceType: this.schemaName,
          referenceName: this.name,
          amount: this.outstandingAmount,
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

    if (!this.stockNotTransferred) {
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

      const item = row.item;
      const quantity = row.stockNotTransferred;
      const trackItem = itemDoc.trackItem;
      const batch = row.batch || null;
      const description = row.description;
      const hsnCode = row.hsnCode;
      let rate = row.rate as Money;

      if (this.exchangeRate && this.exchangeRate > 1) {
        rate = rate.mul(this.exchangeRate);
      }

      if (!quantity || !trackItem) {
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

        if (stock < quantity) {
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
}
