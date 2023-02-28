import { ValidationError } from 'fyo/utils/errors';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { ModelNameEnum } from 'models/types';
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

  const hasBatch = await doc.fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasBatch'
  );

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
