import { Fyo, t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { Item } from 'models/baseModels/Item/Item';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { POSShift } from 'models/inventory/Point of Sale/POSShift';
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
import { showToast } from './interactive';

export async function getItemQtyMap(): Promise<ItemQtyMap> {
  const itemQtyMap: ItemQtyMap = {};
  const valuationMethod =
    fyo.singles.InventorySettings?.valuationMethod ?? ValuationMethod.FIFO;

  const rawSLEs = await getRawStockLedgerEntries(fyo);
  const rawData = getStockLedgerEntries(rawSLEs, valuationMethod);
  const posInventory = fyo.singles.POSSettings?.inventory;

  const stockBalance = getStockBalanceEntries(rawData, {
    location: posInventory,
  });

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

export function validateSinv(sinvDoc: SalesInvoice, itemQtyMap: ItemQtyMap) {
  if (!sinvDoc) {
    return;
  }

  validateSinvItems(sinvDoc.items as SalesInvoiceItem[], itemQtyMap);
}

function validateSinvItems(
  sinvItems: SalesInvoiceItem[],
  itemQtyMap: ItemQtyMap
) {
  for (const item of sinvItems) {
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

export function validateIsPosSettingsSet(fyo: Fyo) {
  try {
    const inventory = fyo.singles.POSSettings?.inventory;
    if (!inventory) {
      throw new ValidationError(
        t`POS Inventory is not set. Please set it on POS Settings`
      );
    }

    const cashAccount = fyo.singles.POSSettings?.cashAccount;
    if (!cashAccount) {
      throw new ValidationError(
        t`POS Counter Cash Account is not set. Please set it on POS Settings`
      );
    }

    const writeOffAccount = fyo.singles.POSSettings?.writeOffAccount;
    if (!writeOffAccount) {
      throw new ValidationError(
        t`POS Write Off Account is not set. Please set it on POS Settings`
      );
    }
  } catch (error) {
    showToast({
      type: 'error',
      message: t`${error as string}`,
      duration: 'long',
    });
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

export function validateClosingAmounts(posShiftDoc: POSShift) {
  try {
    if (!posShiftDoc) {
      throw new ValidationError(
        `POS Shift Document not loaded. Please reload.`
      );
    }

    posShiftDoc.closingAmounts?.map((row) => {
      if (row.closingAmount?.isNegative()) {
        throw new ValidationError(
          t`Closing ${row.paymentMethod as string} Amount can not be negative.`
        );
      }
    });
  } catch (error) {}
}

export async function transferPOSCashAndWriteOff(
  fyo: Fyo,
  posShiftDoc: POSShift
) {
  const expectedCashAmount = posShiftDoc.closingAmounts?.find(
    (row) => row.paymentMethod === 'Cash'
  )?.expectedAmount as Money;

  if (expectedCashAmount.isZero()) {
    return;
  }

  const closingCashAmount = posShiftDoc.closingAmounts?.find(
    (row) => row.paymentMethod === 'Cash'
  )?.closingAmount as Money;

  const jvDoc = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
    entryType: 'Journal Entry',
  });

  await jvDoc.append('accounts', {
    account: AccountTypeEnum.Cash,
    debit: closingCashAmount,
  });

  await jvDoc.append('accounts', {
    account: fyo.singles.POSSettings?.cashAccount,
    credit: closingCashAmount,
  });

  const differenceAmount = posShiftDoc?.closingAmounts?.find(
    (row) => row.paymentMethod === 'Cash'
  )?.differenceAmount as Money;

  if (differenceAmount.isNegative()) {
    await jvDoc.append('accounts', {
      account: AccountTypeEnum.Cash,
      debit: differenceAmount.abs(),
      credit: fyo.pesa(0),
    });
    await jvDoc.append('accounts', {
      account: fyo.singles.POSSettings?.writeOffAccount,
      debit: fyo.pesa(0),
      credit: differenceAmount.abs(),
    });
  }

  if (!differenceAmount.isZero() && differenceAmount.isPositive()) {
    await jvDoc.append('accounts', {
      account: fyo.singles.POSSettings?.writeOffAccount,
      debit: differenceAmount,
      credit: fyo.pesa(0),
    });
    await jvDoc.append('accounts', {
      account: AccountTypeEnum.Cash,
      debit: fyo.pesa(0),
      credit: differenceAmount,
    });
  }

  await (await jvDoc.sync()).submit();
}

export function validateSerialNumberCount(
  serialNumbers: string | undefined,
  quantity: number,
  item: string
) {
  let serialNumberCount = 0;

  if (serialNumbers) {
    serialNumberCount = serialNumbers.split('\n').length;
  }

  if (quantity !== serialNumberCount) {
    const errorMessage = t`Need ${quantity} Serial Numbers for Item ${item}. You have provided ${serialNumberCount}`;

    showToast({
      type: 'error',
      message: errorMessage,
      duration: 'long',
    });
    throw new ValidationError(errorMessage);
  }
}
