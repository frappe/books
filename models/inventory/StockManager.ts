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

  async transferStock(transferDetails: SMTransferDetails) {
    const details = this.#getSMIDetails(transferDetails);
    const item = new StockManagerItem(details, this.fyo);
    await item.transferStock(this.isCancelled);
    this.items.push(item);
  }

  async sync() {
    for (const item of this.items) {
      await item.sync();
    }
  }

  #getSMIDetails(transferDetails: SMTransferDetails): SMIDetails {
    return Object.assign({}, this.details, transferDetails);
  }
}

export class StockManagerItem {
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

  async transferStock(isCancelled: boolean) {
    this.#clear();
    await this.#moveStockForBothLocations(isCancelled);
  }

  async sync() {
    for (const sle of this.stockLedgerEntries ?? []) {
      await sle.sync();
    }
  }

  async #moveStockForBothLocations(isCancelled: boolean) {
    if (this.fromLocation) {
      await this.#moveStockForSingleLocation(
        this.fromLocation,
        isCancelled ? false : true,
        isCancelled
      );
    }

    if (this.toLocation) {
      await this.#moveStockForSingleLocation(
        this.toLocation,
        isCancelled ? true : false,
        isCancelled
      );
    }
  }

  async #moveStockForSingleLocation(
    location: string,
    isOutward: boolean,
    isCancelled: boolean
  ) {
    let quantity = this.quantity!;
    if (quantity === 0) {
      return;
    }

    if (isOutward) {
      quantity = -quantity;
    }

    // Stock Ledger Entry
    if (!isCancelled) {
      const stockLedgerEntry = this.#getStockLedgerEntry(location, quantity);
      this.stockLedgerEntries?.push(stockLedgerEntry);
    }
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
