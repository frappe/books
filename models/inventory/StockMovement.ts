import { Fyo } from 'fyo';
import {
  Action,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import {
  addItem,
  getDocStatusListColumn,
  getLedgerLinkAction,
} from 'models/helpers';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { validateBatch } from './helpers';
import { StockMovementItem } from './StockMovementItem';
import { Transfer } from './Transfer';
import { MovementType } from './types';

export class StockMovement extends Transfer {
  name?: string;
  date?: Date;
  numberSeries?: string;
  movementType?: MovementType;
  items?: StockMovementItem[];
  amount?: Money;

  override get isTransactional(): boolean {
    return false;
  }

  override async getPosting(): Promise<LedgerPosting | null> {
    return null;
  }

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

  async validate() {
    await super.validate();
    this.validateManufacture();
    await validateBatch(this);
  }

  validateManufacture() {
    if (this.movementType !== MovementType.Manufacture) {
      return;
    }

    const hasFrom = this.items?.findIndex((f) => f.fromLocation) !== -1;
    const hasTo = this.items?.findIndex((f) => f.toLocation) !== -1;

    if (!hasFrom) {
      throw new ValidationError(this.fyo.t`Item with From location not found`);
    }

    if (!hasTo) {
      throw new ValidationError(this.fyo.t`Item with To location not found`);
    }
  }

  static filters: FiltersMap = {
    numberSeries: () => ({ referenceType: ModelNameEnum.StockMovement }),
  };

  static defaults: DefaultMap = {
    date: () => new Date(),
  };

  static getListViewSettings(fyo: Fyo): ListViewSettings {
    const movementTypeMap = {
      [MovementType.MaterialIssue]: fyo.t`Material Issue`,
      [MovementType.MaterialReceipt]: fyo.t`Material Receipt`,
      [MovementType.MaterialTransfer]: fyo.t`Material Transfer`,
      [MovementType.Manufacture]: fyo.t`Manufacture`,
    };

    return {
      columns: [
        'name',
        getDocStatusListColumn(),
        'date',
        {
          label: fyo.t`Movement Type`,
          fieldname: 'movementType',
          fieldtype: 'Select',
          display(value): string {
            return movementTypeMap[value as MovementType] ?? '';
          },
        },
      ],
    };
  }

  _getTransferDetails() {
    return (this.items ?? []).map((row) => ({
      item: row.item!,
      rate: row.rate!,
      quantity: row.quantity!,
      batch: row.batch!,
      fromLocation: row.fromLocation,
      toLocation: row.toLocation,
    }));
  }

  static getActions(fyo: Fyo): Action[] {
    return [getLedgerLinkAction(fyo, true)];
  }

  async addItem(name: string) {
    return await addItem(name, this);
  }
}
