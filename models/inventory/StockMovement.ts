import { Doc } from 'fyo/model/doc';
import {
  DefaultMap,
  FiltersMap,
  FormulaMap,
  ListViewSettings
} from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { StockManager } from './StockManager';
import { StockMovementItem } from './StockMovementItem';
import { MovementType } from './types';

export class StockMovement extends Doc {
  name?: string;
  date?: Date;
  numberSeries?: string;
  movementType?: MovementType;
  items?: StockMovementItem[];
  amount?: Money;

  formulas: FormulaMap = {
    amount: {
      formula: () => {
        return this.items?.reduce(
          (acc, item) => acc.add(item.amount ?? 0),
          this.fyo.pesa(0)
        );
      },
      dependsOn: ['items'],
    },
  };

  static filters: FiltersMap = {
    numberSeries: () => ({ referenceType: ModelNameEnum.StockMovement }),
  };

  static defaults: DefaultMap = {
    date: () => new Date(),
  };

  static getListViewSettings(): ListViewSettings {
    return { columns: ['name', 'date', 'movementType'] };
  }

  async afterSubmit(): Promise<void> {
    await this._transferStock();
  }

  async afterCancel(): Promise<void> {
    await this._transferStock();
  }

  async _transferStock() {
    const stockManager = this._getStockManager();
    this._makeTransfers(stockManager);
    await stockManager.sync();
  }

  _makeTransfers(stockManager: StockManager) {
    for (const row of this.items ?? []) {
      stockManager.transferStock({
        item: row.item!,
        rate: row.rate!,
        quantity: row.quantity!,
        fromLocation: row.fromLocation,
        toLocation: row.toLocation,
      });
    }
  }

  _getStockManager(): StockManager {
    return new StockManager(
      {
        date: this.date!,
        referenceName: this.name!,
        referenceType: this.schemaName,
      },
      this.isCancelled,
      this.fyo
    );
  }
}
