import { getDefaultMetaFieldValueMap } from 'backend/helpers';
import { Fyo, t } from 'fyo';
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

  async beforeSync(): Promise<void> {
    await super.beforeSync();
    for (const row of this.items!) {
      const { hasSerialNumber } = await this.fyo.db.get(
        ModelNameEnum.Item,
        row.item!,
        'hasSerialNumber'
      );
      if (hasSerialNumber && row.serialNumber && !this.isCancelled) {
        const serialNumbers = row.serialNumber.split('\n');
        if (serialNumbers.length !== row.quantity)
          throw new ValidationError(
            t`${row.quantity!} Serial Numbers required for ${row.item!}. You have provided ${
              serialNumbers.length
            }.`
          );

        for (const serial of row.serialNumber.split('\n')) {
          const isSerialNumberExists = await this.fyo.db.exists(
            ModelNameEnum.SerialNumber,
            serial
          );

          if (isSerialNumberExists) {
            const serialNumberItem = await this.fyo.db.get(
              ModelNameEnum.SerialNumber,
              serial,
              ['item']
            );

            if (row.item !== serialNumberItem.item) {
              throw new ValidationError(
                t`Serial Number ${serial} can not be given to ${row.item!}`
              );
            }

            const { status } = await this.fyo.db.get(
              ModelNameEnum.SerialNumber,
              serial,
              'status'
            );

            if (this.movementType === 'MaterialIssue') {
              if (status !== 'Active')
                throw new ValidationError(
                  t`Serial Number ${serial} status is not Active`
                );
            }

            continue;
          }

          await this.fyo.db.insert(ModelNameEnum.SerialNumber, {
            name: serial,
            item: row.item,
            status: 'Inactive',
            ...getDefaultMetaFieldValueMap(),
          });
        }
      }
    }
  }

  async afterSubmit(): Promise<void> {
    if (['MaterialReceipt', 'MaterialTransfer'].includes(this.movementType!)) {
      for (const item of this.items!) {
        for (const serial of item.serialNumber?.split('\n')!) {
          await this.fyo.db.update(ModelNameEnum.SerialNumber, {
            name: serial,
            status: 'Active',
          });
        }
      }
    }
    await super.afterSubmit();
  }

  async afterDelete(): Promise<void> {
    if (this.movementType === 'MaterialReceipt') {
      for (const item of this.items!) {
        for (const serial of item.serialNumber?.split('\n')!) {
          await this.fyo.db.update(ModelNameEnum.SerialNumber, {
            name: serial,
            status: 'Inactive',
          });
        }
      }
    }
    await super.afterDelete();
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
    return {
      columns: [
        'name',
        getDocStatusListColumn(),
        'date',
        {
          label: fyo.t`Movement Type`,
          fieldname: 'movementType',
          fieldtype: 'Select',
          size: 'small',
          render(doc) {
            const movementType = doc.movementType as MovementType;
            const label =
              {
                [MovementType.MaterialIssue]: fyo.t`Material Issue`,
                [MovementType.MaterialReceipt]: fyo.t`Material Receipt`,
                [MovementType.MaterialTransfer]: fyo.t`Material Transfer`,
                [MovementType.Manufacture]: fyo.t`Manufacture`,
              }[movementType] ?? '';

            return {
              template: `<span>${label}</span>`,
            };
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
      serialNumber: row.serialNumber!,
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
