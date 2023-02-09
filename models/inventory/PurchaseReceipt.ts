import { getDefaultMetaFieldValueMap } from 'backend/helpers';
import { t } from 'fyo';
import { ListViewSettings } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { getTransactionStatusColumn } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { PurchaseReceiptItem } from './PurchaseReceiptItem';
import { StockTransfer } from './StockTransfer';

export class PurchaseReceipt extends StockTransfer {
  items?: PurchaseReceiptItem[];

  async beforeSync(): Promise<void> {
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

            if (status !== 'Inactive')
              throw new ValidationError(
                t`Serial Number ${serial} status is not Inactive`
              );

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
    await super.beforeSync();
  }

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    for (const item of this.items!) {
      await this.fyo.db.update(ModelNameEnum.SerialNumber, {
        name: item.serialNumber,
        status: 'Active',
        party: this.party,
      });
    }
  }

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: ({ name }) => `/edit/PurchaseReceipt/${name}`,
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'grandTotal',
      ],
    };
  }
}
