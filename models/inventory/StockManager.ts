import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import { DateTime } from 'luxon';
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
      await this.#createTransfer(details);
    }

    await this.#sync();
  }

  async cancelTransfers() {
    const { referenceName, referenceType } = this.details;

    // updating serialNumber status to Inactive
    const serialNumbers = (await this.fyo.db.getSNFromSLEByReferenceName(
      referenceName
    )) as [];

    for (const serial of serialNumbers) {
      await this.fyo.db.update(ModelNameEnum.SerialNumber, {
        name: serial,
        status: 'Inactive',
      });
    }

    await this.fyo.db.deleteAll(ModelNameEnum.StockLedgerEntry, {
      referenceType,
      referenceName,
    });
  }

  async validateCancel(transferDetails: SMTransferDetails[]) {
    const reverseTransferDetails = transferDetails.map(
      ({ item, rate, quantity, fromLocation, toLocation }) => ({
        item,
        rate,
        quantity,
        fromLocation: toLocation,
        toLocation: fromLocation,
      })
    );
    await this.validateTransfers(reverseTransferDetails);
  }

  async #sync() {
    for (const item of this.items) {
      await item.sync();
    }
  }

  async #createTransfer(details: SMIDetails) {
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
    await this.#validateSerialNumberWiseStockAvailability(details);
  }

  #validateQuantity(details: SMIDetails) {
    if (!details.quantity) {
      throw new ValidationError(t`Quantity needs to be set`);
    }

    if (details.quantity <= 0) {
      throw new ValidationError(
        t`Quantity (${details.quantity}) has to be greater than zero`
      );
    }
  }

  #validateRate(details: SMIDetails) {
    if (!details.rate) {
      throw new ValidationError(t`Rate needs to be set`);
    }

    if (details.rate.lte(0)) {
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
    let quantityBefore =
      (await this.fyo.db.getStockQuantity(
        details.item,
        details.fromLocation,
        undefined,
        date
      )) ?? 0;

    const formattedDate = this.fyo.format(details.date, 'Datetime');

    if (this.isCancelled) {
      quantityBefore += details.quantity;
    }

    if (quantityBefore < details.quantity) {
      throw new ValidationError(
        [
          t`Insufficient Quantity.`,
          t`Additional quantity (${
            details.quantity - quantityBefore
          }) required to make outward transfer of item ${details.item} from ${
            details.fromLocation
          } on ${formattedDate}`,
        ].join('\n')
      );
    }

    const quantityAfter = await this.fyo.db.getStockQuantity(
      details.item,
      details.fromLocation,
      details.date.toISOString()
    );
    if (quantityAfter === null) {
      // No future transactions
      return;
    }

    const quantityRemaining = quantityBefore - details.quantity;
    if (quantityAfter < quantityRemaining) {
      throw new ValidationError(
        [
          t`Insufficient Quantity.`,
          t`Transfer will cause future entries to have negative stock.`,
          t`Additional quantity (${
            quantityAfter - quantityRemaining
          }) required to make outward transfer of item ${details.item} from ${
            details.fromLocation
          } on ${formattedDate}`,
        ].join('\n')
      );
    }
  }

  async #validateSerialNumberWiseStockAvailability(details: SMIDetails) {
    const { hasSerialNumber } = await this.fyo.db.get(
      ModelNameEnum.Item,
      details.item,
      'hasSerialNumber'
    );

    // If item has a serial number, then it will check if the document is not cancelled
    if (hasSerialNumber && !this.isCancelled) {
      if (!details.serialNumber)
        throw new ValidationError(t`Serial Number not provided`);

      // splits the serialNumbers by newLine
      const serialNumbers = details.serialNumber!.split('\n');

      // checking if number of serial numbers not equals the entered quantity
      if (serialNumbers.length !== details.quantity)
        throw new ValidationError(
          t`${details.quantity} Serial Numbers required for ${details.item}. You have provided ${serialNumbers.length}.`
        );

      // looping through serial Numbers
      for (const serial of serialNumbers) {
        // checking if serialNumber exists
        const isSerialNumberExists = await this.fyo.db.exists(
          ModelNameEnum.SerialNumber,
          serial
        );

        // Shipment Validations
        if (['Shipment'].includes(details.referenceType)) {
          if (!isSerialNumberExists)
            throw new ValidationError(
              t`Serial Number ${serial} does not exist`
            );

          const { status } = await this.fyo.db.get(
            ModelNameEnum.SerialNumber,
            serial,
            'status'
          );

          if (status !== 'Active')
            throw new ValidationError(
              t`Serial Number ${serial} status is not Active`
            );
        }

        if (isSerialNumberExists) {
          const serialNumberItem = await this.fyo.db.get(
            ModelNameEnum.SerialNumber,
            serial,
            ['item']
          );

          // checking if given serialNumber belongs to the item
          if (details.item !== serialNumberItem.item) {
            throw new ValidationError(
              t`Serial Number ${serial} can not be given to ${details.item!}`
            );
          }
        }
      }
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
    let quantity = this.quantity!;
    if (quantity === 0) {
      return;
    }

    if (isOutward) {
      quantity = -quantity;
    }

    const serialNumbers = this.serialNumber
      ? this.serialNumber.split('\n')
      : null;

    if (['Shipment'].includes(this.referenceType)) {
      // changing serialNumber status to Delivered
      for (const serial of serialNumbers!) {
        this.fyo.db.update(ModelNameEnum.SerialNumber, {
          name: serial,
          status: 'Delivered',
        });
      }
    }

    // Stock Ledger Entry
    const stockLedgerEntry = this.#getStockLedgerEntry(
      location,
      quantity,
      serialNumbers?.join(' ')
    );
    this.stockLedgerEntries?.push(stockLedgerEntry);
  }

  #getStockLedgerEntry(
    location: string,
    quantity: number,
    serialNumber: string | null = null
  ) {
    return this.fyo.doc.getNewDoc(ModelNameEnum.StockLedgerEntry, {
      date: this.date,
      item: this.item,
      rate: this.rate,
      serialNumber,
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
