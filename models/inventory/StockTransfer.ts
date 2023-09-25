import { t } from 'fyo';
import { Attachment, DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  ChangeArg,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  HiddenMap,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { Defaults } from 'models/baseModels/Defaults/Defaults';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { addItem, getNumberSeries } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { TargetField } from 'schemas/types';
import { SerialNumber } from './SerialNumber';
import { StockTransferItem } from './StockTransferItem';
import { Transfer } from './Transfer';
import {
  canValidateSerialNumber,
  getSerialNumberFromDoc,
  updateSerialNumbers,
  validateBatch,
  validateSerialNumber,
} from './helpers';
import { ReturnDocItem } from './types';
import { getShipmentCOGSAmountFromSLEs } from 'reports/inventory/helpers';

export abstract class StockTransfer extends Transfer {
  name?: string;
  date?: Date;
  party?: string;
  terms?: string;
  attachment?: Attachment;
  grandTotal?: Money;
  backReference?: string;
  items?: StockTransferItem[];
  isReturned?: boolean;
  returnAgainst?: string;

  get isSales() {
    return this.schemaName === ModelNameEnum.Shipment;
  }

  get isReturn(): boolean {
    return !!this.returnAgainst;
  }

  get invoiceSchemaName() {
    if (this.isSales) {
      return ModelNameEnum.SalesInvoice;
    }
    return ModelNameEnum.PurchaseInvoice;
  }

  formulas: FormulaMap = {
    grandTotal: {
      formula: () => this.getSum('items', 'amount', false),
      dependsOn: ['items'],
    },
  };

  hidden: HiddenMap = {
    backReference: () =>
      !(this.backReference || !(this.isSubmitted || this.isCancelled)),
    terms: () => !(this.terms || !(this.isSubmitted || this.isCancelled)),
    attachment: () =>
      !(this.attachment || !(this.isSubmitted || this.isCancelled)),
    returnAgainst: () =>
      (this.isSubmitted || this.isCancelled) && !this.returnAgainst,
  };

  static defaults: DefaultMap = {
    numberSeries: (doc) => getNumberSeries(doc.schemaName, doc.fyo),
    terms: (doc) => {
      const defaults = doc.fyo.singles.Defaults;
      if (doc.schemaName === ModelNameEnum.Shipment) {
        return defaults?.shipmentTerms ?? '';
      }

      return defaults?.purchaseReceiptTerms ?? '';
    },
    date: () => new Date(),
  };

  static filters: FiltersMap = {
    party: (doc: Doc) => ({
      role: ['in', [doc.isSales ? 'Customer' : 'Supplier', 'Both']],
    }),
    numberSeries: (doc: Doc) => ({ referenceType: doc.schemaName }),
    backReference: () => ({
      stockNotTransferred: ['!=', 0],
      submitted: true,
      cancelled: false,
    }),
  };

  override _getTransferDetails() {
    return (this.items ?? []).map((row) => {
      let fromLocation = undefined;
      let toLocation = undefined;

      if (this.isSales) {
        fromLocation = row.location;
      } else {
        toLocation = row.location;
      }

      return {
        item: row.item!,
        rate: row.rate!,
        quantity: row.quantity!,
        batch: row.batch!,
        serialNumber: row.serialNumber!,
        isReturn: row.isReturn,
        fromLocation,
        toLocation,
      };
    });
  }

  override async getPosting(): Promise<LedgerPosting | null> {
    await this.validateAccounts();
    const stockInHand = (await this.fyo.getValue(
      ModelNameEnum.InventorySettings,
      'stockInHand'
    )) as string;

    const amount = await this.getPostingAmount();
    const posting = new LedgerPosting(this, this.fyo);

    if (this.isSales) {
      const costOfGoodsSold = (await this.fyo.getValue(
        ModelNameEnum.InventorySettings,
        'costOfGoodsSold'
      )) as string;

      if (this.isReturn) {
        await posting.debit(stockInHand, amount);
        await posting.credit(costOfGoodsSold, amount);
      } else {
        await posting.debit(costOfGoodsSold, amount);
        await posting.credit(stockInHand, amount);
      }
    } else {
      const stockReceivedButNotBilled = (await this.fyo.getValue(
        ModelNameEnum.InventorySettings,
        'stockReceivedButNotBilled'
      )) as string;

      if (this.isReturn) {
        await posting.debit(stockReceivedButNotBilled, amount);
        await posting.credit(stockInHand, amount);
      } else {
        await posting.debit(stockInHand, amount);
        await posting.credit(stockReceivedButNotBilled, amount);
      }
    }

    await posting.makeRoundOffEntry();
    return posting;
  }

  async getPostingAmount(): Promise<Money> {
    if (!this.isSales) {
      return this.grandTotal ?? this.fyo.pesa(0);
    }

    return await getShipmentCOGSAmountFromSLEs(this);
  }

  async validateAccounts() {
    const settings: string[] = ['stockInHand'];
    if (this.isSales) {
      settings.push('costOfGoodsSold');
    } else {
      settings.push('stockReceivedButNotBilled');
    }

    const messages: string[] = [];
    for (const setting of settings) {
      const value = this.fyo.singles.InventorySettings?.[setting] as
        | string
        | undefined;
      const field = this.fyo.getField(ModelNameEnum.InventorySettings, setting);
      if (!value) {
        messages.push(t`${field.label} account not set in Inventory Settings.`);
        continue;
      }

      const exists = await this.fyo.db.exists(ModelNameEnum.Account, value);
      if (!exists) {
        messages.push(t`Account ${value} does not exist.`);
      }
    }

    if (messages.length) {
      throw new ValidationError(messages.join(' '));
    }
  }

  override async validate(): Promise<void> {
    await super.validate();
    await validateBatch(this);
    await validateSerialNumber(this);
    await validateSerialNumberStatus(this);
    await this._validateHasReturnDocs();
  }

  async afterSubmit() {
    await super.afterSubmit();
    await updateSerialNumbers(this, false, this.isReturn);
    await this._updateBackReference();
    await this._updateItemsReturned();
  }

  async afterCancel(): Promise<void> {
    await super.afterCancel();
    await updateSerialNumbers(this, true, this.isReturn);
    await this._updateBackReference();
    await this._updateItemsReturned();
  }

  async _updateBackReference() {
    if (!this.isCancelled && !this.isSubmitted) {
      return;
    }

    if (!this.backReference) {
      return;
    }

    const schemaName = this.isSales
      ? ModelNameEnum.SalesInvoice
      : ModelNameEnum.PurchaseInvoice;

    const invoice = (await this.fyo.doc.getDoc(
      schemaName,
      this.backReference
    )) as Invoice;
    const transferMap = this._getTransferMap();

    for (const row of invoice.items ?? []) {
      const item = row.item!;
      const quantity = row.quantity!;
      const notTransferred = (row.stockNotTransferred as number) ?? 0;

      const transferred = transferMap[item];
      if (
        typeof transferred !== 'number' ||
        typeof notTransferred !== 'number'
      ) {
        continue;
      }

      if (this.isCancelled) {
        await row.set(
          'stockNotTransferred',
          Math.min(notTransferred + transferred, quantity)
        );
        transferMap[item] = Math.max(
          transferred + notTransferred - quantity,
          0
        );
      } else {
        await row.set(
          'stockNotTransferred',
          Math.max(notTransferred - transferred, 0)
        );
        transferMap[item] = Math.max(transferred - notTransferred, 0);
      }
    }

    const notTransferred = invoice.getStockNotTransferred();
    await invoice.setAndSync('stockNotTransferred', notTransferred);
  }

  async _updateItemsReturned() {
    if (!this.returnAgainst) {
      return;
    }

    const linkedReference = await this.loadAndGetLink('returnAgainst');
    if (!linkedReference) {
      return;
    }

    const referenceDoc = await this.fyo.doc.getDoc(
      this.schemaName,
      linkedReference.name
    );

    const isReturned = this.isSubmitted;
    await referenceDoc.setAndSync({ isReturned });
  }

  async _validateHasReturnDocs() {
    if (!this.name || !this.isCancelled) {
      return;
    }

    const returnDocs = await this.fyo.db.getAll(this.schemaName, {
      filters: { returnAgainst: this.name },
    });

    const hasReturnDocs = !!returnDocs.length;
    if (!hasReturnDocs) {
      return;
    }

    const returnDocNames = returnDocs.map((doc) => doc.name).join(', ');
    const label = this.fyo.schemaMap[this.schemaName]?.label ?? this.schemaName;

    throw new ValidationError(
      t`Cannot cancel ${this.schema.label} ${this.name} because of the following ${label}: ${returnDocNames}`
    );
  }

  _getTransferMap() {
    return (this.items ?? []).reduce((acc, item) => {
      if (!item.item) {
        return acc;
      }

      if (!item.quantity) {
        return acc;
      }

      acc[item.item] ??= 0;
      acc[item.item] += item.quantity;

      return acc;
    }, {} as Record<string, number>);
  }

  override duplicate(): Doc {
    const doc = super.duplicate() as StockTransfer;
    doc.backReference = undefined;
    return doc;
  }

  static createFilters: FiltersMap = {
    party: (doc: Doc) => ({
      role: doc.isSales ? 'Customer' : 'Supplier',
    }),
  };

  async addItem(name: string) {
    return await addItem(name, this);
  }

  override async change({ doc, changed }: ChangeArg): Promise<void> {
    if (doc.name === this.name && changed === 'backReference') {
      await this.setFieldsFromBackReference();
    }
  }

  async setFieldsFromBackReference() {
    const backReference = this.backReference;
    const { target } = this.fyo.getField(
      this.schemaName,
      'backReference'
    ) as TargetField;

    if (!backReference || !target) {
      return;
    }

    const brDoc = await this.fyo.doc.getDoc(target, backReference);
    if (!(brDoc instanceof Invoice)) {
      return;
    }

    const stDoc = await brDoc.getStockTransfer();
    if (!stDoc) {
      return;
    }

    await this.set('party', stDoc.party);
    await this.set('terms', stDoc.terms);
    await this.set('date', stDoc.date);
    await this.set('items', stDoc.items);
  }

  async getInvoice(): Promise<Invoice | null> {
    if (!this.isSubmitted || this.backReference) {
      return null;
    }

    const schemaName = this.invoiceSchemaName;

    const defaults = (this.fyo.singles.Defaults as Defaults) ?? {};
    let terms;
    let numberSeries;
    if (this.isSales) {
      terms = defaults.salesInvoiceTerms ?? '';
      numberSeries = defaults.salesInvoiceNumberSeries ?? undefined;
    } else {
      terms = defaults.purchaseInvoiceTerms ?? '';
      numberSeries = defaults.purchaseInvoiceNumberSeries ?? undefined;
    }

    const data = {
      party: this.party,
      date: new Date().toISOString(),
      terms,
      numberSeries,
      backReference: this.name,
    };

    const invoice = this.fyo.doc.getNewDoc(schemaName, data) as Invoice;
    for (const row of this.items ?? []) {
      if (!row.item) {
        continue;
      }

      const item = row.item;
      const unit = row.unit;
      const quantity = row.quantity;
      const batch = row.batch || null;
      const rate = row.rate ?? this.fyo.pesa(0);
      const description = row.description;
      const hsnCode = row.hsnCode;

      if (!quantity) {
        continue;
      }

      await invoice.append('items', {
        item,
        quantity,
        unit,
        rate,
        batch,
        hsnCode,
        description,
      });
    }

    if (!invoice.items?.length) {
      return null;
    }

    return invoice;
  }

  async getReturnDoc(): Promise<StockTransfer | undefined> {
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
    ) as StockTransfer;

    await newReturnDoc.runFormulas();
    return newReturnDoc;
  }
}

async function validateSerialNumberStatus(doc: StockTransfer) {
  if (doc.isCancelled) {
    return;
  }

  for (const { serialNumber, item } of getSerialNumberFromDoc(doc)) {
    const cannotValidate = !(await canValidateSerialNumber(item, serialNumber));
    if (cannotValidate) {
      continue;
    }

    const snDoc = await doc.fyo.doc.getDoc(
      ModelNameEnum.SerialNumber,
      serialNumber
    );

    if (!(snDoc instanceof SerialNumber)) {
      continue;
    }

    const status = snDoc.status ?? 'Inactive';
    const isSubmitted = !!doc.isSubmitted;
    const isReturn = !!doc.returnAgainst;

    if (isSubmitted || isReturn) {
      return;
    }

    if (
      doc.schemaName === ModelNameEnum.PurchaseReceipt &&
      status !== 'Inactive'
    ) {
      throw new ValidationError(
        t`Serial Number ${serialNumber} is not Inactive`
      );
    }

    if (doc.schemaName === ModelNameEnum.Shipment && status !== 'Active') {
      throw new ValidationError(
        t`Serial Number ${serialNumber} is not Active.`
      );
    }
  }
}
