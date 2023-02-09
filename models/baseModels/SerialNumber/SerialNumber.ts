import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { getSerialNumberStatusColumn } from 'models/helpers';

export class SerialNumber extends Doc {
  async beforeSync(): Promise<void> {
    const isItemExistsInSLE = await this.fyo.db.isSerialNumberHasTransactions(
      this.name!
    );

    if (isItemExistsInSLE) {
      throw new ValidationError(
        t`Serial Number ${this
          .name!} can not be edited because it has transactions against it.`
      );
    }
    await super.beforeSync();
  }

  async beforeDelete(): Promise<void> {
    const isItemExistsInSLE = await this.fyo.db.isSerialNumberHasTransactions(
      this.name!
    );

    if (isItemExistsInSLE) {
      throw new ValidationError(
        t`Serial Number ${this
          .name!} can not be deleted because it has transactions against it`
      );
    }
    await super.beforeDelete();
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'item', 'itemType', getSerialNumberStatusColumn()],
    };
  }
}
