import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ColumnConfig, RenderData } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { ModelNameEnum, PriceListStatus } from 'models/types';
import { StockMovement } from './StockMovement';
import { StockMovementItem } from './StockMovementItem';
import { StockTransfer } from './StockTransfer';
import { StockTransferItem } from './StockTransferItem';

export async function validateBatch(
  doc: StockMovement | StockTransfer | Invoice
) {
  for (const row of doc.items ?? []) {
    await validateItemRowBatch(row);
  }
}

async function validateItemRowBatch(
  doc: StockMovementItem | StockTransferItem | InvoiceItem
) {
  const idx = doc.idx ?? 0 + 1;
  const item = doc.item;
  const batch = doc.batch;
  if (!item) {
    return;
  }

  const hasBatch = await doc.fyo.getValue(ModelNameEnum.Item, item, 'hasBatch');

  if (!hasBatch && batch) {
    throw new ValidationError(
      [
        doc.fyo.t`Batch set for row ${idx}.`,
        doc.fyo.t`Item ${item} is not a batched item`,
      ].join(' ')
    );
  }

  if (hasBatch && !batch) {
    throw new ValidationError(
      [
        doc.fyo.t`Batch not set for row ${idx}.`,
        doc.fyo.t`Item ${item} is a batched item`,
      ].join(' ')
    );
  }
}

export function getPriceListStatusColumn(): ColumnConfig {
  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      const status = getPLStatus(doc) as PriceListStatus;
      const color = statusColor[status];

      return {
        template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
      };
    },
  };
}

export function getPLStatus(doc?: RenderData | Doc): PriceListStatus {
  if (!doc) return 'Disabled';

  if (doc.validUpto) {
    if ((doc.validUpto as Date) < new Date()) {
      return 'Expired';
    }
  }

  if (doc.enabled) {
    return 'Enabled';
  }

  return 'Disabled';
}

export const statusColor: Record<PriceListStatus, string | undefined> = {
  Enabled: 'green',
  Disabled: 'gray',
  Expired: 'red',
};
