import { Fyo, t } from 'fyo';
import {
  Action,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { getDocStatusListColumn, getLedgerLinkAction } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { SerialNumber } from './SerialNumber';
import { StockMovementItem } from './StockMovementItem';
import { Transfer } from './Transfer';
import {
  canValidateSerialNumber,
  createBatch,
  generateBatchForItem,
  getSerialNumberFromDoc,
  updateSerialNumbers,
  validateBatch,
  validateSerialNumber,
} from './helpers';
import { MovementType, MovementTypeEnum } from './types';

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

  // eslint-disable-next-line @typescript-eslint/require-await
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
    await validateSerialNumber(this);
    await validateSerialNumberStatus(this);
  }

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    await updateSerialNumbers(this, false);
  }

  async beforeSubmit(): Promise<void> {
    await super.beforeSubmit();

    const batchesToCreate: { item: string; batch: string }[] = [];

    for (const item of this.items ?? []) {
      if (!item.item || !item.batch) {
        continue;
      }

      const hasBatch = await this.fyo.getValue(
        ModelNameEnum.Item,
        item.item,
        'hasBatch'
      );

      if (hasBatch) {
        const batchExists = await this.fyo.db.exists(
          ModelNameEnum.Batch,
          item.batch
        );

        if (!batchExists) {
          batchesToCreate.push({
            item: item.item,
            batch: item.batch,
          });
        }
      }
    }

    for (const { item, batch } of batchesToCreate) {
      await createBatch(this.fyo, item, batch);
    }
  }

  async afterCancel(): Promise<void> {
    await super.afterCancel();
    await updateSerialNumbers(this, true);
  }

  validateManufacture() {
    if (this.movementType !== MovementTypeEnum.Manufacture) {
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
      [MovementTypeEnum.MaterialIssue]: fyo.t`Material Issue`,
      [MovementTypeEnum.MaterialReceipt]: fyo.t`Material Receipt`,
      [MovementTypeEnum.MaterialTransfer]: fyo.t`Material Transfer`,
      [MovementTypeEnum.Manufacture]: fyo.t`Manufacture`,
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
            return movementTypeMap[value as MovementTypeEnum] ?? '';
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
      batch: row.batch ?? undefined,
      serialNumber: row.serialNumber ?? undefined,
      fromLocation: row.fromLocation ?? undefined,
      toLocation: row.toLocation ?? undefined,
    }));
  }

  static getActions(fyo: Fyo): Action[] {
    return [getLedgerLinkAction(fyo, true)];
  }

  async addItem(name: string) {
    const itemDoc = await this.fyo.doc.getDoc(ModelNameEnum.Item, name);
    if (!itemDoc) {
      throw new ValidationError(t`Item ${name} not found`);
    }

    let batch: string | null | undefined =
      (itemDoc.defaultBatch as string | null | undefined) ?? null;

    if (
      this.movementType === MovementTypeEnum.MaterialReceipt &&
      itemDoc.hasBatch &&
      !batch
    ) {
      batch = await generateBatchForItem(this.fyo, name);
    }

    const item = {
      name: itemDoc.name,
      batch,
    };

    if (item.batch) {
      const batchDoc = await this.fyo.doc.getDoc(
        ModelNameEnum.Batch,
        item.batch
      );
      if (batchDoc && batchDoc.item !== name) {
        throw new ValidationError(
          t`Batch ${item.batch} does not belong to Item ${name}`
        );
      }
    }

    return item;
  }
}

async function validateSerialNumberStatus(doc: StockMovement) {
  if (doc.isCancelled) {
    return;
  }

  for (const { serialNumber, item } of getSerialNumberFromDoc(doc)) {
    const cannotValidate = !(await canValidateSerialNumber(item, serialNumber));
    if (cannotValidate) {
      continue;
    }

    const snDoc = await doc.fyo.doc.getDoc(
      ModelNameEnum.SerialNumber,
      serialNumber
    );

    if (!(snDoc instanceof SerialNumber)) {
      continue;
    }

    const status = snDoc.status ?? 'Inactive';

    if (doc.movementType === 'MaterialReceipt' && status !== 'Inactive') {
      throw new ValidationError(
        t`Non Inactive Serial Number ${serialNumber} cannot be used for Material Receipt`
      );
    }

    if (doc.movementType === 'MaterialIssue' && status !== 'Active') {
      throw new ValidationError(
        t`Non Active Serial Number ${serialNumber} cannot be used for Material Issue`
      );
    }

    if (doc.movementType === 'MaterialTransfer' && status !== 'Active') {
      throw new ValidationError(
        t`Non Active Serial Number ${serialNumber} cannot be used for Material Transfer`
      );
    }

    if (item.fromLocation && status !== 'Active') {
      throw new ValidationError(
        t`Non Active Serial Number ${serialNumber} cannot be used as Manufacture raw material`
      );
    }
  }
}
