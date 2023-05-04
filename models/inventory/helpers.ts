import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import type { Invoice } from 'models/baseModels/Invoice/Invoice';
import type { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { ModelNameEnum } from 'models/types';
import { SerialNumber } from './SerialNumber';
import type { StockMovement } from './StockMovement';
import type { StockMovementItem } from './StockMovementItem';
import type { StockTransfer } from './StockTransfer';
import type { StockTransferItem } from './StockTransferItem';
import type { SerialNumberStatus } from './types';

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
  const idx = doc.idx ?? 0;
  const item = doc.item;
  const batch = doc.batch;
  if (!item) {
    return;
  }

  const hasBatch = await doc.fyo.getValue(ModelNameEnum.Item, item, 'hasBatch');

  if (!hasBatch && batch) {
    throw new ValidationError(
      [
        doc.fyo.t`Batch set for row ${idx + 1}.`,
        doc.fyo.t`Item ${item} is not a batched item`,
      ].join(' ')
    );
  }

  if (hasBatch && !batch) {
    throw new ValidationError(
      [
        doc.fyo.t`Batch not set for row ${idx + 1}.`,
        doc.fyo.t`Item ${item} is a batched item`,
      ].join(' ')
    );
  }
}

export async function validateSerialNumber(doc: StockMovement | StockTransfer) {
  for (const row of doc.items ?? []) {
    await validateItemRowSerialNumber(row);
  }
}

async function validateItemRowSerialNumber(
  row: StockMovementItem | StockTransferItem
) {
  const idx = row.idx ?? 0;
  const item = row.item;

  if (!item) {
    return;
  }

  if (row.parentdoc?.cancelled) {
    return;
  }

  const hasSerialNumber = await row.fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasSerialNumber'
  );

  if (hasSerialNumber && !row.serialNumber) {
    throw new ValidationError(
      [
        row.fyo.t`Serial Number not set for row ${idx + 1}.`,
        row.fyo.t`Serial Number is enabled for Item ${item}`,
      ].join(' ')
    );
  }

  if (!hasSerialNumber && row.serialNumber) {
    throw new ValidationError(
      [
        row.fyo.t`Serial Number set for row ${idx + 1}.`,
        row.fyo.t`Serial Number is not enabled for Item ${item}`,
      ].join(' ')
    );
  }

  const serialNumber = row.serialNumber;
  if (!hasSerialNumber || typeof serialNumber !== 'string') {
    return;
  }

  const serialNumbers = getSerialNumbers(serialNumber);
  for (const serialNumber of serialNumbers) {
    if (await row.fyo.db.exists(ModelNameEnum.SerialNumber, serialNumber)) {
      continue;
    }

    throw new ValidationError(t`Serial Number ${serialNumber} does not exist.`);
  }

  const quantity = row.quantity ?? 0;
  if (serialNumbers.length !== quantity) {
    throw new ValidationError(
      t`Additional ${
        quantity - serialNumbers.length
      } Serial Numbers required for ${quantity} quantity of ${item}.`
    );
  }

  for (const serialNumber of serialNumbers) {
    const snDoc = await row.fyo.doc.getDoc(
      ModelNameEnum.SerialNumber,
      serialNumber
    );

    if (!(snDoc instanceof SerialNumber)) {
      continue;
    }

    if (snDoc.item !== item) {
      throw new ValidationError(
        t`Serial Number ${serialNumber} does not belong to the item ${item}.`
      );
    }

    const status = snDoc.status ?? 'Inactive';
    const schemaName = row.parentSchemaName;

    if (schemaName === 'PurchaseReceipt' && status !== 'Inactive') {
      throw new ValidationError(
        t`Serial Number ${serialNumber} is not Inactive`
      );
    }

    if (schemaName === 'Shipment' && status !== 'Active') {
      throw new ValidationError(
        t`Serial Number ${serialNumber} is not Active.`
      );
    }
  }
}

export function getSerialNumbers(serialNumber: string): string[] {
  if (!serialNumber) {
    return [];
  }

  return serialNumber.split('\n').map((s) => s.trim());
}

export function getSerialNumberFromDoc(doc: StockTransfer | StockMovement) {
  if (!doc.items?.length) {
    return [];
  }

  return doc.items
    .map((item) => getSerialNumbers(item.serialNumber ?? ''))
    .flat()
    .filter(Boolean);
}

export async function updateSerialNumbers(
  doc: StockTransfer | StockMovement,
  isCancel: boolean
) {
  for (const row of doc.items ?? []) {
    if (!row.serialNumber) {
      continue;
    }

    const status = getSerialNumberStatus(doc, isCancel, row.quantity ?? 0);
    await updateSerialNumberStatus(status, row.serialNumber, doc.fyo);
  }
}

async function updateSerialNumberStatus(
  status: SerialNumberStatus,
  serialNumber: string,
  fyo: Fyo
) {
  for (const name of getSerialNumbers(serialNumber)) {
    await fyo.db.update(ModelNameEnum.SerialNumber, {
      name,
      status,
    });
  }
}

function getSerialNumberStatus(
  doc: StockTransfer | StockMovement,
  isCancel: boolean,
  quantity: number
): SerialNumberStatus {
  if (doc.schemaName === ModelNameEnum.Shipment) {
    return isCancel ? 'Active' : 'Delivered';
  }

  if (doc.schemaName === ModelNameEnum.PurchaseReceipt) {
    return isCancel ? 'Inactive' : 'Active';
  }

  return getSerialNumberStatusForStockMovement(
    doc as StockMovement,
    isCancel,
    quantity
  );
}

function getSerialNumberStatusForStockMovement(
  doc: StockMovement,
  isCancel: boolean,
  quantity: number
): SerialNumberStatus {
  if (doc.movementType === 'MaterialIssue') {
    return isCancel ? 'Active' : 'Inactive';
  }

  if (doc.movementType === 'MaterialReceipt') {
    return isCancel ? 'Inactive' : 'Active';
  }

  if (doc.movementType === 'MaterialTransfer') {
    return 'Active';
  }

  // MovementType is Manufacture
  if (quantity < 0) {
    return isCancel ? 'Active' : 'Inactive';
  }

  return isCancel ? 'Inactive' : 'Active';
}
