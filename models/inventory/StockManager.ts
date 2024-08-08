import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { StockLedgerEntry } from './StockLedgerEntry';
import { SMDetails, SMIDetails, SMTransferDetails } from './types';
import { getSerialNumbers } from './helpers';

export class StockManager {
  /**
   * The Stock Manager manages a group of Stock Manager Items
   * all of which would belong to a single transaction such as a
   * single Stock Movement entry.
   */

  items: StockManagerItem[];
  details: SMDetails;

  isCancelled: boolean;
  fyo: Fyo;

  constructor(details: SMDetails, isCancelled: boolean, fyo: Fyo) {
    this.items = [];
    this.details = details;
    this.isCancelled = isCancelled;
    this.fyo = fyo;
  }

  async validateTransfers(transferDetails: SMTransferDetails[]) {
    const detailsList = transferDetails.map((d) => this.#getSMIDetails(d));
    for (const details of detailsList) {
      await this.#validate(details);
    }
  }

  async createTransfers(transferDetails: SMTransferDetails[]) {
    const detailsList = transferDetails.map((d) => this.#getSMIDetails(d));
    for (const details of detailsList) {
      await this.#validate(details);
    }

    for (const details of detailsList) {
      this.#createTransfer(details);
    }

    await this.#sync();
  }

  async cancelTransfers() {
    const { referenceName, referenceType } = this.details;
    await this.fyo.db.deleteAll(ModelNameEnum.StockLedgerEntry, {
      referenceType,
      referenceName,
    });
  }

  async validateCancel(transferDetails: SMTransferDetails[]) {
    const reverseTransferDetails = transferDetails.map(
      ({ item, rate, quantity, fromLocation, toLocation, isReturn }) => ({
        item,
        rate,
        quantity,
        fromLocation: toLocation,
        toLocation: fromLocation,
        isReturn,
      })
    );
    await this.validateTransfers(reverseTransferDetails);
  }

  async #sync() {
    for (const item of this.items) {
      await item.sync();
    }
  }

  #createTransfer(details: SMIDetails) {
    const item = new StockManagerItem(details, this.fyo);
    item.transferStock();
    this.items.push(item);
  }

  #getSMIDetails(transferDetails: SMTransferDetails): SMIDetails {
    return Object.assign({}, this.details, transferDetails);
  }

  async #validate(details: SMIDetails) {
    this.#validateRate(details);
    this.#validateQuantity(details);
    this.#validateLocation(details);
    await this.#validateStockAvailability(details);
  }

  #validateQuantity(details: SMIDetails) {
    if (!details.quantity) {
      throw new ValidationError(t`Quantity needs to be set`);
    }
    if (!details.isReturn && details.quantity <= 0) {
      throw new ValidationError(
        t`Quantity (${details.quantity}) has to be greater than zero`
      );
    }
  }

  #validateRate(details: SMIDetails) {
    if (!details.rate) {
      throw new ValidationError(t`Rate needs to be set`);
    }

    if (details.rate.lt(0)) {
      throw new ValidationError(
        t`Rate (${details.rate.float}) has to be greater than zero`
      );
    }
  }

  #validateLocation(details: SMIDetails) {
    if (details.fromLocation) {
      return;
    }

    if (details.toLocation) {
      return;
    }

    throw new ValidationError(t`Both From and To Location cannot be undefined`);
  }

  async #validateStockAvailability(details: SMIDetails) {
    if (!details.fromLocation) {
      return;
    }

    const date = details.date.toISOString();
    const formattedDate = this.fyo.format(details.date, 'Datetime');
    const batch = details.batch || undefined;
    const serialNumbers = getSerialNumbers(details.serialNumber ?? '');

    let quantityBefore =
      (await this.fyo.db.getStockQuantity(
        details.item,
        details.fromLocation,
        undefined,
        date,
        batch,
        serialNumbers
      )) ?? 0;

    if (this.isCancelled) {
      quantityBefore += details.quantity;
    }

    const batchMessage = !!batch ? t` in Batch ${batch}` : '';

    if (!details.isReturn && quantityBefore < details.quantity) {
      throw new ValidationError(
        [
          t`Insufficient Quantity.`,
          t`Additional quantity (${
            details.quantity - quantityBefore
          }) required${batchMessage} to make outward transfer of item ${
            details.item
          } from ${details.fromLocation} on ${formattedDate}`,
        ].join('\n')
      );
    }

    const quantityAfter = await this.fyo.db.getStockQuantity(
      details.item,
      details.fromLocation,
      details.date.toISOString(),
      undefined,
      batch,
      serialNumbers
    );

    if (quantityAfter === null) {
      // No future transactions
      return;
    }

    const quantityRemaining = quantityBefore - details.quantity;
    const futureQuantity = quantityRemaining + quantityAfter;
    if (futureQuantity < 0) {
      throw new ValidationError(
        [
          t`Insufficient Quantity.`,
          t`Transfer will cause future entries to have negative stock.`,
          t`Additional quantity (${-futureQuantity}) required${batchMessage} to make outward transfer of item ${
            details.item
          } from ${details.fromLocation} on ${formattedDate}`,
        ].join('\n')
      );
    }
  }
}

class StockManagerItem {
  /**
   * The Stock Manager Item is used to move stock to and from a location. It
   * updates the Stock Queue and creates Stock Ledger Entries.
   *
   * 1. Get existing stock Queue
   * 5. Create Stock Ledger Entry
   * 7. Insert Stock Ledger Entry
   */

  date: Date;
  item: string;
  rate: Money;
  quantity: number;
  referenceName: string;
  referenceType: string;
  fromLocation?: string;
  toLocation?: string;
  batch?: string;
  serialNumber?: string;

  stockLedgerEntries?: StockLedgerEntry[];

  fyo: Fyo;

  constructor(details: SMIDetails, fyo: Fyo) {
    this.date = details.date;
    this.item = details.item;
    this.rate = details.rate;
    this.quantity = details.quantity;
    this.fromLocation = details.fromLocation;
    this.toLocation = details.toLocation;
    this.referenceName = details.referenceName;
    this.referenceType = details.referenceType;
    this.batch = details.batch;
    this.serialNumber = details.serialNumber;

    this.fyo = fyo;
  }

  transferStock() {
    this.#clear();
    this.#moveStockForBothLocations();
  }

  async sync() {
    const sles = [
      this.stockLedgerEntries?.filter((s) => s.quantity! <= 0),
      this.stockLedgerEntries?.filter((s) => s.quantity! > 0),
    ]
      .flat()
      .filter(Boolean);

    for (const sle of sles) {
      await sle!.sync();
    }
  }

  #moveStockForBothLocations() {
    if (this.fromLocation) {
      this.#moveStockForSingleLocation(this.fromLocation, true);
    }

    if (this.toLocation) {
      this.#moveStockForSingleLocation(this.toLocation, false);
    }
  }

  #moveStockForSingleLocation(location: string, isOutward: boolean) {
    let quantity: number = this.quantity;
    if (quantity === 0) {
      return;
    }

    const serialNumbers = getSerialNumbers(this.serialNumber ?? '');
    if (serialNumbers.length) {
      const snStockLedgerEntries = this.#getSerialNumberedStockLedgerEntries(
        location,
        isOutward,
        serialNumbers
      );

      this.stockLedgerEntries?.push(...snStockLedgerEntries);
      return;
    }

    if (isOutward) {
      quantity = -quantity;
    }

    const stockLedgerEntry = this.#getStockLedgerEntry(location, quantity);
    this.stockLedgerEntries?.push(stockLedgerEntry);
  }

  #getSerialNumberedStockLedgerEntries(
    location: string,
    isOutward: boolean,
    serialNumbers: string[]
  ): StockLedgerEntry[] {
    let quantity = 1;
    if (isOutward) {
      quantity = -1;
    }

    return serialNumbers.map((sn) =>
      this.#getStockLedgerEntry(location, quantity, sn)
    );
  }

  #getStockLedgerEntry(
    location: string,
    quantity: number,
    serialNumber?: string
  ): StockLedgerEntry {
    return this.fyo.doc.getNewDoc(ModelNameEnum.StockLedgerEntry, {
      date: this.date,
      item: this.item,
      rate: this.rate,
      batch: this.batch || null,
      serialNumber: serialNumber || null,
      quantity,
      location,
      referenceName: this.referenceName,
      referenceType: this.referenceType,
    }) as StockLedgerEntry;
  }

  #clear() {
    this.stockLedgerEntries = [];
  }
}
