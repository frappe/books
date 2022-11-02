import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { StockLedgerEntry } from './StockLedgerEntry';
import { SMDetails, SMIDetails, SMTransferDetails } from './types';

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

  async createTransfers(transferDetails: SMTransferDetails[]) {
    for (const detail of transferDetails) {
      await this.#createTransfer(detail);
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

  async #sync() {
    for (const item of this.items) {
      await item.sync();
    }
  }

  async #createTransfer(transferDetails: SMTransferDetails) {
    const details = this.#getSMIDetails(transferDetails);
    const item = new StockManagerItem(details, this.fyo);
    await item.transferStock();
    this.items.push(item);
  }

  #getSMIDetails(transferDetails: SMTransferDetails): SMIDetails {
    return Object.assign({}, this.details, transferDetails);
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
    this.#validate();

    this.fyo = fyo;
  }

  transferStock() {
    this.#clear();
    this.#moveStockForBothLocations();
  }

  async sync() {
    for (const sle of this.stockLedgerEntries ?? []) {
      await sle.sync();
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
    let quantity = this.quantity!;
    if (quantity === 0) {
      return;
    }

    if (isOutward) {
      quantity = -quantity;
    }

    // Stock Ledger Entry
    const stockLedgerEntry = this.#getStockLedgerEntry(location, quantity);
    this.stockLedgerEntries?.push(stockLedgerEntry);
  }

  #getStockLedgerEntry(location: string, quantity: number) {
    return this.fyo.doc.getNewDoc(ModelNameEnum.StockLedgerEntry, {
      date: this.date,
      item: this.item,
      rate: this.rate,
      quantity,
      location,
      referenceName: this.referenceName,
      referenceType: this.referenceType,
    }) as StockLedgerEntry;
  }

  #clear() {
    this.stockLedgerEntries = [];
  }

  #validate() {
    this.#validateRate();
    this.#validateQuantity();
    this.#validateLocation();
  }

  #validateQuantity() {
    if (!this.quantity) {
      throw new ValidationError(t`Stock Manager: quantity needs to be set`);
    }

    if (this.quantity <= 0) {
      throw new ValidationError(
        t`Stock Manager: quantity (${this.quantity}) has to be greater than zero`
      );
    }
  }

  #validateRate() {
    if (!this.rate) {
      throw new ValidationError(t`Stock Manager: rate needs to be set`);
    }

    if (this.rate.lte(0)) {
      throw new ValidationError(
        t`Stock Manager: rate (${this.rate.float}) has to be greater than zero`
      );
    }
  }

  #validateLocation() {
    if (this.fromLocation) {
      return;
    }

    if (this.toLocation) {
      return;
    }

    throw new ValidationError(
      t`Stock Manager: both From and To Location cannot be undefined`
    );
  }
}
