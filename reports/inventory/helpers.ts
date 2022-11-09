import { Fyo } from 'fyo';
import { StockQueue } from 'models/inventory/stockQueue';
import { ModelNameEnum } from 'models/types';
import { safeParseFloat, safeParseInt } from 'utils/index';
import { ComputedStockLedgerEntry, RawStockLedgerEntry } from './types';

export async function getRawStockLedgerEntries(fyo: Fyo) {
  const fieldnames = [
    'name',
    'date',
    'item',
    'rate',
    'quantity',
    'location',
    'referenceName',
    'referenceType',
  ];

  return (await fyo.db.getAllRaw(ModelNameEnum.StockLedgerEntry, {
    fields: fieldnames,
    orderBy: 'date',
    order: 'asc',
  })) as RawStockLedgerEntry[];
}

export function getStockLedgerEntries(
  rawSLEs: RawStockLedgerEntry[]
): ComputedStockLedgerEntry[] {
  type Item = string;
  type Location = string;

  const computedSLEs: ComputedStockLedgerEntry[] = [];
  const stockQueues: Record<Item, Record<Location, StockQueue>> = {};

  for (const sle of rawSLEs) {
    const name = safeParseInt(sle.name);
    const date = new Date(sle.date);
    const rate = safeParseFloat(sle.rate);
    const { item, location, quantity, referenceName, referenceType } = sle;

    if (quantity === 0) {
      continue;
    }

    stockQueues[item] ??= {};
    stockQueues[item][location] ??= new StockQueue();

    const q = stockQueues[item][location];
    const initialValue = q.value;

    let incomingRate: number | null;
    if (quantity > 0) {
      incomingRate = q.inward(rate, quantity);
    } else {
      incomingRate = q.outward(-quantity);
    }

    if (incomingRate === null) {
      continue;
    }

    const balanceQuantity = q.quantity;
    const valuationRate = q.fifo;
    const balanceValue = q.value;
    const valueChange = balanceValue - initialValue;

    const csle: ComputedStockLedgerEntry = {
      name,
      date,

      item,
      location,

      quantity,
      balanceQuantity,

      incomingRate,
      valuationRate,

      balanceValue,
      valueChange,

      referenceName,
      referenceType,
    };

    computedSLEs.push(csle);
  }

  return computedSLEs;
}
