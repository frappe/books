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
  const idx = doc.idx ?? 0 + 1;
  const item = doc.item;
  const batchNumber = doc.batchNumber;
  if (!item) {
    return;
  }

  const hasBatchNumber = await doc.fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasBatchNumber'
  );

  if (!hasBatchNumber && batchNumber) {
    throw new ValidationError(
      [
        doc.fyo.t`Batch Number set for row ${idx}.`,
        doc.fyo.t`Item ${item} is not a batched item`,
      ].join(' ')
    );
  }

  if (hasBatchNumber && !batchNumber) {
    throw new ValidationError(
      [
        doc.fyo.t`Batch Number not set for row ${idx}.`,
        doc.fyo.t`Item ${item} is a batched item`,
      ].join(' ')
    );
  }
}
