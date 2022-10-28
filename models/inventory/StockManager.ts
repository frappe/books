import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { getStockQueue } from './helpers';
import { StockLedgerEntry } from './StockLedgerEntry';
import { SMDetails } from './types';

export class StockManager {
  /**
   * The Stock Manager is used to move stock to and from a location. It
   * updates the Stock Queue and creates Stock Ledger Entries.
   *
   * 1. Get existing stock Queue
   * 2. Get Stock Value Before from Stock Queue
   * 3. Update Stock Queue
   * 4. Get Stock Value After from Stock Queue
   * 5. Create Stock Ledger Entry
   * 6. Save Stock Queue
   * 7. Insert Stock Ledger Entry
   */

  date?: Date;
  item?: string;
  rate?: Money;
  quantity?: number;
  fromLocation?: string;
  toLocation?: string;
  referenceName?: string;
  referenceType?: string;
  stockValue?: string;
  stockValueDifference?: string;

  fyo: Fyo;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  moveStock(details: SMDetails) {
    this.date = details.date;
    this.item = details.item;
    this.quantity = details.quantity;
    this.fromLocation = details.fromLocation;
    this.toLocation = details.toLocation;
    this.referenceName = details.referenceName;
    this.referenceType = details.referenceType;

    this.#validate();
    this.#moveStockForBothLocations();
  }

  async #moveStockForBothLocations() {
    if (this.fromLocation) {
      await this.#moveStockForSingleLocation(this.fromLocation, true);
    }

    if (this.toLocation) {
      await this.#moveStockForSingleLocation(this.toLocation, false);
    }
  }

  async #moveStockForSingleLocation(location: string, isOutward: boolean) {
    let quantity = this.quantity!;
    if (isOutward) {
      quantity = -quantity;
    }

    const { stockQueue, stockValueBefore, stockValueAfter } =
      await this.#makeStockQueueChange(location, isOutward);
    const stockLedgerEntry = this.#getStockLedgerEntry(
      location,
      quantity,
      stockValueBefore,
      stockValueAfter
    );

    await stockQueue.sync();
    await stockLedgerEntry.sync();
  }

  #getStockLedgerEntry(
    location: string,
    quantity: number,
    stockValueBefore: Money,
    stockValueAfter: Money
  ) {
    return this.fyo.doc.getNewDoc(ModelNameEnum.StockLedgerEntry, {
      date: this.date,
      item: this.item,
      rate: this.rate,
      quantity,
      location,
      stockValueBefore,
      stockValueAfter,
      referenceName: this.referenceName,
      referenceType: this.referenceType,
    }) as StockLedgerEntry;
  }

  async #makeStockQueueChange(location: string, isOutward: boolean) {
    const stockQueue = await getStockQueue(this.item!, location, this.fyo);
    const stockValueBefore = stockQueue.stockValue!;
    let isSuccess;

    if (isOutward) {
      isSuccess = stockQueue.outward(-this.quantity!);
    } else {
      isSuccess = stockQueue.inward(this.rate!, this.quantity!);
    }

    if (!isSuccess && isOutward) {
      throw new ValidationError(
        t`Stock Manager: Insufficient quantity ${
          stockQueue.quantity
        } at ${location} of ${this
          .item!} for outward transaction. Quantity required ${this.quantity!}.`
      );
    }

    const stockValueAfter = stockQueue.stockValue!;

    return { stockQueue, stockValueBefore, stockValueAfter };
  }

  #validate() {
    this.#validateRate();
    this.#validateLocation();
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
