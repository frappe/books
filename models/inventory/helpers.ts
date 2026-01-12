import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import type { Invoice } from 'models/baseModels/Invoice/Invoice';
import type { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { ModelNameEnum } from 'models/types';
import { SerialNumber } from './SerialNumber';
import type { StockMovement } from './StockMovement';
import type { StockMovementItem } from './StockMovementItem';
import { StockTransfer } from './StockTransfer';
import type { StockTransferItem } from './StockTransferItem';
import { Transfer } from './Transfer';
import { TransferItem } from './TransferItem';
import type { SerialNumberStatus } from './types';
import SerialNumberSeries from 'fyo/models/SerialNumberSeries';

export async function validateBatch(
  doc: StockMovement | StockTransfer | Invoice
) {
  if (doc.schemaName === ModelNameEnum.SalesQuote) {
    return;
  }
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
  if (doc.schemaName === ModelNameEnum.SalesQuote) {
    return;
  }
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
  if (row.parentdoc?.schemaName === ModelNameEnum.SalesQuote) {
    return;
  }
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

  const quantity = Math.abs(row.quantity ?? 0);
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
    const isReturn = !!row.parentdoc?.returnAgainst;
    const isSubmitted = !!row.parentdoc?.submitted;

    if (
      schemaName === 'PurchaseReceipt' &&
      status !== 'Inactive' &&
      !isSubmitted &&
      !isReturn
    ) {
      throw new ValidationError(
        t`Serial Number ${serialNumber} is not Inactive`
      );
    }

    if (
      schemaName === 'Shipment' &&
      status !== 'Active' &&
      !isSubmitted &&
      !isReturn
    ) {
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
  isCancel: boolean,
  isReturn = false
) {
  for (const row of doc.items ?? []) {
    if (!row.serialNumber) {
      continue;
    }

    const status = getSerialNumberStatus(doc, row, isCancel, isReturn);
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
  isCancel: boolean,
  isReturn: boolean
): SerialNumberStatus {
  if (doc.schemaName === ModelNameEnum.Shipment) {
    if (isReturn) {
      return isCancel ? 'Delivered' : 'Active';
    }
    return isCancel ? 'Active' : 'Delivered';
  }

  if (doc.schemaName === ModelNameEnum.PurchaseReceipt) {
    if (isReturn) {
      return isCancel ? 'Active' : 'Delivered';
    }
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

export async function generateSerialNumbersForItem(
  fyo: Fyo,
  item: string,
  quantity: number
): Promise<string> {
  if (!quantity || quantity <= 0) {
    return '';
  }

  const hasSerialNumber = await fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasSerialNumber'
  );

  if (!hasSerialNumber) {
    return '';
  }

  const serialNumberSeries = await fyo.getValue(
    ModelNameEnum.Item,
    item,
    'serialNumberSeries'
  );

  if (!serialNumberSeries || typeof serialNumberSeries !== 'string') {
    return '';
  }

  const seriesName = serialNumberSeries.trim();
  if (!seriesName) {
    return '';
  }

  const exists = await fyo.db.exists(
    ModelNameEnum.SerialNumberSeries,
    seriesName
  );

  if (!exists) {
    return '';
  }

  const seriesDoc = (await fyo.doc.getDoc(
    ModelNameEnum.SerialNumberSeries,
    seriesName
  )) as SerialNumberSeries;

  const serialNumbers: string[] = [];
  const padZeros = seriesDoc.padZeros as number;

  let currentValue = await getHighestSerialNumberForItem(fyo, item, seriesName);

  if (currentValue === null) {
    currentValue =
      ((seriesDoc.current as number) || (seriesDoc.start as number)) - 1;
  }

  let generatedCount = 0;
  let attempts = 0;
  const maxAttempts = quantity * 10;

  while (generatedCount < quantity && attempts < maxAttempts) {
    attempts++;
    currentValue++;

    const serialNumber = getPaddedName(seriesName, currentValue, padZeros);

    const snExists = await fyo.db.exists(
      ModelNameEnum.SerialNumber,
      serialNumber
    );

    if (!snExists) {
      serialNumbers.push(serialNumber);
      generatedCount++;
    }
  }

  if (generatedCount < quantity) {
  }

  if (serialNumbers.length > 0) {
    await seriesDoc.set('current', currentValue);
    await seriesDoc.sync();
  }

  const result = serialNumbers.join('\n');
  return result;
}

async function getHighestSerialNumberForItem(
  fyo: Fyo,
  item: string,
  seriesName: string
): Promise<number | null> {
  const serialNumbers = await fyo.db.getAllRaw(ModelNameEnum.SerialNumber, {
    filters: { item: item },
    fields: ['name'],
  });

  if (!serialNumbers || serialNumbers.length === 0) {
    return null;
  }

  let highestValue = -1;

  for (const sn of serialNumbers) {
    const name = sn.name as string;

    if (name.startsWith(seriesName)) {
      const numericPart = name.substring(seriesName.length);
      const value = parseInt(numericPart, 10);

      if (!isNaN(value) && value > highestValue) {
        highestValue = value;
      }
    }
  }

  return highestValue >= 0 ? highestValue : null;
}

function getPaddedName(prefix: string, next: number, padZeros: number): string {
  return prefix + next.toString().padStart(padZeros ?? 4, '0');
}

export async function getExistingActiveSerialNumbersForItem(
  fyo: Fyo,
  item: string,
  quantity: number
): Promise<string> {
  if (!quantity || quantity <= 0) {
    return '';
  }

  const hasSerialNumber = await fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasSerialNumber'
  );

  if (!hasSerialNumber) {
    return '';
  }

  const activeSerialNumbers = await fyo.db.getAll(ModelNameEnum.SerialNumber, {
    fields: ['name'],
    filters: { item: item, status: 'Active' },
    orderBy: 'name',
    order: 'asc',
  });

  if (!activeSerialNumbers || activeSerialNumbers.length === 0) {
    return '';
  }

  const usedInShipments = await fyo.db.getAll(ModelNameEnum.ShipmentItem, {
    fields: ['serialNumber'],
    filters: {
      item: item,
    },
  });

  const usedInPurchaseReceipts = await fyo.db.getAll(
    ModelNameEnum.PurchaseReceiptItem,
    {
      fields: ['serialNumber'],
      filters: {
        item: item,
      },
    }
  );

  const usedSerialNumbers = new Set<string>();

  usedInShipments.forEach((shipmentItem) => {
    if (shipmentItem.serialNumber) {
      const serialNumArray = getSerialNumbers(
        String(shipmentItem.serialNumber)
      );
      serialNumArray.forEach((sn) => usedSerialNumbers.add(sn));
    }
  });

  usedInPurchaseReceipts.forEach((receiptItem) => {
    if (receiptItem.serialNumber) {
      const serialNumArray = getSerialNumbers(String(receiptItem.serialNumber));
      serialNumArray.forEach((sn) => usedSerialNumbers.add(sn));
    }
  });

  const availableSerialNumbers = activeSerialNumbers
    .map((sn) => String(sn.name))
    .filter((snName) => !usedSerialNumbers.has(snName));

  if (availableSerialNumbers.length === 0) {
    return '';
  }

  const selectedSerialNumbers = availableSerialNumbers.slice(0, quantity);

  return selectedSerialNumbers.join('\n');
}
