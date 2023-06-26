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
import {
  addItem,
  getDocStatusListColumn,
  getLedgerLinkAction,
} from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { SerialNumber } from './SerialNumber';
import { StockMovementItem } from './StockMovementItem';
import { Transfer } from './Transfer';
import {
  canValidateSerialNumber,
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
      batch: row.batch!,
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
