import { ValidationError } from 'fyo/utils/errors';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { ModelNameEnum } from 'models/types';
import { StockMovement } from './StockMovement';
import { StockMovementItem } from './StockMovementItem';
import { StockTransfer } from './StockTransfer';
import { StockTransferItem } from './StockTransferItem';

export async function validateBatchNumber(
  doc: StockMovement | StockTransfer | Invoice
) {
  for (const row of doc.items ?? []) {
    await validateItemRowBatchNumber(row);
  }
}

async function validateItemRowBatchNumber(
  doc: StockMovementItem | StockTransferItem | InvoiceItem
) {
  const item = doc.item;
  const batchNumber = doc.batchNumber;
  if (!item || batchNumber) {
    return;
  }

  const hasBatchNumber = await doc.fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasBatchNumber'
  );

  if (hasBatchNumber && batchNumber) {
    return;
  }

  throw new ValidationError(
    [`Batch Number not set.`, `Item ${item} is a batched item`].join(' ')
  );
}
