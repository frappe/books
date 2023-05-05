import { Transactional } from 'models/Transactional/Transactional';
import { StockManager } from './StockManager';
import type { SMTransferDetails } from './types';
import type { TransferItem } from './TransferItem';
import { createSerialNumbers } from './helpers';

export abstract class Transfer extends Transactional {
  date?: Date;
  items?: TransferItem[];

  async beforeSubmit(): Promise<void> {
    await super.beforeSubmit();
    const transferDetails = this._getTransferDetails();
    await this._getStockManager().validateTransfers(transferDetails);
  }

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    await createSerialNumbers(this);
    const transferDetails = this._getTransferDetails();
    await this._getStockManager().createTransfers(transferDetails);
  }

  async beforeCancel(): Promise<void> {
    await super.beforeCancel();
    const transferDetails = this._getTransferDetails();
    const stockManager = this._getStockManager();
    stockManager.isCancelled = true;
    await stockManager.validateCancel(transferDetails);
  }

  async afterCancel(): Promise<void> {
    await super.afterCancel();
    await this._getStockManager().cancelTransfers();
  }

  _getStockManager(): StockManager {
    let date = this.date!;
    if (typeof date === 'string') {
      date = new Date(date);
    }

    return new StockManager(
      {
        date,
        referenceName: this.name!,
        referenceType: this.schemaName,
      },
      this.isCancelled,
      this.fyo
    );
  }

  abstract _getTransferDetails(): SMTransferDetails[];
}
