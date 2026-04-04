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
import { Transfer } from './Transfer';
import { TransferItem } from './TransferItem';
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
  if (doc.isCancelled) {
    return;
  }

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

  const quantity = row.quantity ?? 0;
  if (serialNumbers.length !== quantity) {
    throw new ValidationError(
      t`Additional ${
        quantity - serialNumbers.length
      } Serial Numbers required for ${quantity} quantity of ${item}.`
    );
  }

  const nonExistingIncomingSerialNumbers: string[] = [];
  for (const serialNumber of serialNumbers) {
    if (await row.fyo.db.exists(ModelNameEnum.SerialNumber, serialNumber)) {
      continue;
    }

    if (isSerialNumberIncoming(row)) {
      nonExistingIncomingSerialNumbers.push(serialNumber);
      continue;
    }

    throw new ValidationError(t`Serial Number ${serialNumber} does not exist.`);
  }

  for (const serialNumber of serialNumbers) {
    if (nonExistingIncomingSerialNumbers.includes(serialNumber)) {
      continue;
    }

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

  return serialNumber
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getSerialNumberFromDoc(doc: StockTransfer | StockMovement) {
  if (!doc.items?.length) {
    return [];
  }

  return doc.items
    .map((item) =>
      getSerialNumbers(item.serialNumber ?? '').map((serialNumber) => ({
        serialNumber,
        item,
      }))
    )
    .flat()
    .filter(Boolean);
}

export async function createSerialNumbers(doc: Transfer) {
  const items = doc.items ?? [];
  const serialNumberCreateList = items
    .map((item) => {
      const serialNumbers = getSerialNumbers(item.serialNumber ?? '');
      return serialNumbers.map((serialNumber) => ({
        item: item.item ?? '',
        serialNumber,
        isIncoming: isSerialNumberIncoming(item),
      }));
    })
    .flat()
    .filter(({ item, isIncoming }) => isIncoming && item);

  for (const { item, serialNumber } of serialNumberCreateList) {
    if (await doc.fyo.db.exists(ModelNameEnum.SerialNumber, serialNumber)) {
      continue;
    }

    const snDoc = doc.fyo.doc.getNewDoc(ModelNameEnum.SerialNumber, {
      name: serialNumber,
      item,
    });

    const status: SerialNumberStatus = 'Active';
    await snDoc.set('status', status);
    await snDoc.sync();
  }
}

function isSerialNumberIncoming(item: TransferItem) {
  if (item.parentdoc?.schemaName === ModelNameEnum.Shipment) {
    return false;
  }

  if (item.parentdoc?.schemaName === ModelNameEnum.PurchaseReceipt) {
    return true;
  }

  return !!item.toLocation && !item.fromLocation;
}

export async function canValidateSerialNumber(
  item: StockTransferItem | StockMovementItem,
  serialNumber: string
) {
  if (!isSerialNumberIncoming(item)) {
    return true;
  }

  return await item.fyo.db.exists(ModelNameEnum.SerialNumber, serialNumber);
}

export async function updateSerialNumbers(
  doc: StockTransfer | StockMovement,
  isCancel: boolean
) {
  for (const row of doc.items ?? []) {
    if (!row.serialNumber) {
      continue;
    }

    const status = getSerialNumberStatus(doc, row, isCancel);
    await updateSerialNumberStatus(status, row.serialNumber, doc.fyo);
  }
}

async function updateSerialNumberStatus(
  status: SerialNumberStatus,
  serialNumber: string,
  fyo: Fyo
) {
  for (const name of getSerialNumbers(serialNumber)) {
    const doc = await fyo.doc.getDoc(ModelNameEnum.SerialNumber, name);
    await doc.setAndSync('status', status);
  }
}

function getSerialNumberStatus(
  doc: StockTransfer | StockMovement,
  item: StockTransferItem | StockMovementItem,
  isCancel: boolean
): SerialNumberStatus {
  if (doc.schemaName === ModelNameEnum.Shipment) {
    return isCancel ? 'Active' : 'Delivered';
  }

  if (doc.schemaName === ModelNameEnum.PurchaseReceipt) {
    return isCancel ? 'Inactive' : 'Active';
  }

  return getSerialNumberStatusForStockMovement(
    doc as StockMovement,
    item,
    isCancel
  );
}

function getSerialNumberStatusForStockMovement(
  doc: StockMovement,
  item: StockTransferItem | StockMovementItem,
  isCancel: boolean
): SerialNumberStatus {
  if (doc.movementType === 'MaterialIssue') {
    return isCancel ? 'Active' : 'Delivered';
  }

  if (doc.movementType === 'MaterialReceipt') {
    return isCancel ? 'Inactive' : 'Active';
  }

  if (doc.movementType === 'MaterialTransfer') {
    return 'Active';
  }

  // MovementType is Manufacture
  if (item.fromLocation) {
    return isCancel ? 'Active' : 'Delivered';
  }

  return isCancel ? 'Inactive' : 'Active';
}
