import { t } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ValidationError } from 'fyo/utils/errors';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { ModelNameEnum } from 'models/types';
import { ShipmentItem } from './ShipmentItem';
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

export async function validateSerialNo(
  doc: StockMovement | StockTransfer | Invoice
) {
  for (const row of doc.items ?? []) {
    await validateItemRowSerialNo(row, doc.movementType as string);
  }
}

async function validateItemRowSerialNo(
  doc: StockMovementItem | StockTransferItem | InvoiceItem,
  movementType: string
) {
  const idx = doc.idx ?? 0 + 1;
  const item = doc.item;

  if (!item) {
    return;
  }

  if (doc.parentdoc?.cancelled) {
    return;
  }

  const hasSerialNo = await doc.fyo.getValue(
    ModelNameEnum.Item,
    item,
    'hasSerialNo'
  );

  if (hasSerialNo && !doc.serialNo) {
    throw new ValidationError(
      [
        doc.fyo.t`Serial No not set for row ${idx}.`,
        doc.fyo.t`Serial No is enabled for Item ${item}`,
      ].join(' ')
    );
  }

  if (!hasSerialNo && doc.serialNo) {
    throw new ValidationError(
      [
        doc.fyo.t`Serial No set for row ${idx}.`,
        doc.fyo.t`Serial No is not enabled for Item ${item}`,
      ].join(' ')
    );
  }

  if (!hasSerialNo) return;

  const serialNos = getSerialNumbers(doc.serialNo as string);

  if (serialNos.length !== doc.quantity) {
    throw new ValidationError(
      t`${doc.quantity!} Serial Numbers required for ${doc.item!}. You have provided ${
        serialNos.length
      }.`
    );
  }

  for (const serialNo of serialNos) {
    const { name, status, item } = await doc.fyo.db.get(
      ModelNameEnum.SerialNo,
      serialNo,
      ['name', 'status', 'item']
    );

    if (movementType == 'MaterialIssue') {
      await validateSNMaterialIssue(
        doc,
        name as string,
        item as string,
        serialNo,
        status as string
      );
    }

    if (movementType == 'MaterialReceipt') {
      await validateSNMaterialReceipt(
        doc,
        name as string,
        serialNo,
        status as string
      );
    }

    if (movementType === 'Shipment') {
      await validateSNShipment(doc, serialNo);
    }

    if (doc.parentSchemaName === 'PurchaseReceipt') {
      await validateSNPurchaseReceipt(
        doc,
        name as string,
        serialNo,
        status as string
      );
    }
  }
}

export const getSerialNumbers = (serialNo: string): string[] => {
  return serialNo ? serialNo.split('\n') : [];
};

export const updateSerialNoStatus = async (
  doc: Doc,
  items: StockMovementItem[] | ShipmentItem[],
  newStatus: string
) => {
  for (const item of items) {
    const serialNos = getSerialNumbers(item.serialNo!);
    if (!serialNos.length) return;

    for (const serialNo of serialNos) {
      await doc.fyo.db.update(ModelNameEnum.SerialNo, {
        name: serialNo,
        status: newStatus,
      });
    }
  }
};

const validateSNMaterialReceipt = async (
  doc: Doc,
  name: string,
  serialNo: string,
  status: string
) => {
  if (name === undefined) {
    const values = {
      name: serialNo,
      item: doc.item,
      party: doc.parentdoc?.party as string,
    };
    (
      await doc.fyo.doc
        .getNewDoc(ModelNameEnum.SerialNo, values as DocValueMap)
        .sync()
    ).submit();
  }

  if (status && status !== 'Inactive') {
    throw new ValidationError(t`SerialNo ${serialNo} status is not Inactive`);
  }
};

const validateSNPurchaseReceipt = async (
  doc: Doc,
  name: string,
  serialNo: string,
  status: string
) => {
  if (name === undefined) {
    const values = {
      name: serialNo,
      item: doc.item,
      party: doc.parentdoc?.party as string,
      status: 'Inactive',
    };
    (
      await doc.fyo.doc
        .getNewDoc(ModelNameEnum.SerialNo, values as DocValueMap)
        .sync()
    ).submit();
  }

  if (status && status !== 'Inactive') {
    throw new ValidationError(t`SerialNo ${serialNo} status is not Inactive`);
  }
};

const validateSNMaterialIssue = async (
  doc: Doc,
  name: string,
  item: string,
  serialNo: string,
  status: string
) => {
  if (doc.isCancelled) return;

  if (!name)
    throw new ValidationError(t`Serial Number ${serialNo} does not exist.`);

  if (status !== 'Active')
    throw new ValidationError(
      t`Serial Number ${serialNo} status is not Active`
    );
  if (doc.item !== item) {
    throw new ValidationError(
      t`Serial Number ${serialNo} does not belong to the item ${
        doc.item! as string
      }`
    );
  }
};

const validateSNShipment = async (doc: Doc, serialNo: string) => {
  const { status } = await doc.fyo.db.get(
    ModelNameEnum.SerialNo,
    serialNo,
    'status'
  );

  if (status !== 'Active')
    throw new ValidationError(t`Serial No ${serialNo} status is not Active`);
};
