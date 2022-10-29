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
    const stockManagers = this._getStockManagers();
    for (const sm of stockManagers) {
      sm.transferStock(this.isCancelled);
    }

    for (const sm of stockManagers) {
      await sm.sync();
    }
  }

  _getStockManagers(): StockManager[] {
    const stockManagers: StockManager[] = [];
    for (const row of this.items ?? []) {
      const stockManager = this._getStockManager(row);
      stockManagers.push(stockManager);
    }

    return stockManagers;
  }

  _getStockManager(row: StockMovementItem): StockManager {
    return new StockManager(
      {
        date: this.date!,
        item: row.item!,
        rate: row.rate!,
        quantity: row.quantity!,
        referenceName: this.name!,
        referenceType: this.schemaName,
        fromLocation: row.fromLocation,
        toLocation: row.toLocation,
      },
      this.fyo
    );
  }
}
