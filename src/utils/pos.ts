import { t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import { Item } from 'models/baseModels/Item/Item';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { ValuationMethod } from 'models/inventory/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import {
  getRawStockLedgerEntries,
  getStockBalanceEntries,
  getStockLedgerEntries,
} from 'reports/inventory/helpers';
import { ItemQtyMap, ItemSerialNumbers } from 'src/components/POS/types';
import { fyo } from 'src/initFyo';
import { safeParseFloat } from 'utils/index';

export async function getItemQtyMap(): Promise<ItemQtyMap> {
  const itemQtyMap: ItemQtyMap = {};
  const valuationMethod =
    fyo.singles.InventorySettings?.valuationMethod ?? ValuationMethod.FIFO;

  const rawSLEs = await getRawStockLedgerEntries(fyo);
  const rawData = getStockLedgerEntries(rawSLEs, valuationMethod);

  const stockBalance = getStockBalanceEntries(rawData, {});

  for (const row of stockBalance) {
    if (!itemQtyMap[row.item]) {
      itemQtyMap[row.item] = { availableQty: 0 };
    }

    if (row.batch) {
      itemQtyMap[row.item][row.batch] = row.balanceQuantity;
    }

    itemQtyMap[row.item].availableQty += row.balanceQuantity;
  }
  return itemQtyMap;
}

export function getTotalQuantity(items: SalesInvoiceItem[]): number {
  let totalQuantity = safeParseFloat(0);

  if (!items.length) {
    return totalQuantity;
  }

  for (const item of items) {
    const quantity = item.quantity ?? 0;
    totalQuantity = safeParseFloat(totalQuantity + quantity);
  }
  return totalQuantity;
}

export function getItemDiscounts(items: SalesInvoiceItem[]): Money {
  let itemDiscounts = fyo.pesa(0);

  if (!items.length) {
    return itemDiscounts;
  }

  for (const item of items) {
    if (!item.itemDiscountAmount?.isZero()) {
      itemDiscounts = itemDiscounts.add(item.itemDiscountAmount as Money);
    }

    if (item.amount && (item.itemDiscountPercent as number) > 1) {
      itemDiscounts = itemDiscounts.add(
        item.amount.percent(item.itemDiscountPercent as number)
      );
    }
  }
  return itemDiscounts;
}

export async function getItem(item: string): Promise<Item | undefined> {
  const itemDoc = (await fyo.doc.getDoc(ModelNameEnum.Item, item)) as Item;
  if (!itemDoc) {
    return;
  }

  return itemDoc;
}

export function validateSinv(
  items: SalesInvoiceItem[],
  itemQtyMap: ItemQtyMap
) {
  if (!items) {
    return;
  }

  for (const item of items) {
    if (!item.quantity || item.quantity < 1) {
      throw new ValidationError(
        t`Invalid Quantity for Item ${item.item as string}`
      );
    }

    if (!itemQtyMap[item.item as string]) {
      throw new ValidationError(t`Item ${item.item as string} not in Stock`);
    }

    if (item.quantity > itemQtyMap[item.item as string].availableQty) {
      throw new ValidationError(
        t`Insufficient Quantity. Item ${item.item as string} has only ${
          itemQtyMap[item.item as string].availableQty
        } quantities available. you selected ${item.quantity}`
      );
    }
  }
}

export async function validateShipment(itemSerialNumbers: ItemSerialNumbers) {
  if (!itemSerialNumbers) {
    return;
  }

  for (const idx in itemSerialNumbers) {
    const serialNumbers = itemSerialNumbers[idx].split('\n');

    for (const serialNumber of serialNumbers) {
      const status = await fyo.getValue(
        ModelNameEnum.SerialNumber,
        serialNumber,
        'status'
      );

      if (status !== 'Active') {
        throw new ValidationError(
          t`Serial Number ${serialNumber} status is not Active.`
        );
      }
    }
  }
}

export function getTotalTaxedAmount(sinvDoc: SalesInvoice): Money {
  let totalTaxedAmount = fyo.pesa(0);
  if (!sinvDoc.items?.length || !sinvDoc.taxes?.length) {
    return totalTaxedAmount;
  }

  for (const row of sinvDoc.taxes) {
    totalTaxedAmount = totalTaxedAmount.add(row.amount as Money);
  }
  return totalTaxedAmount;
}
