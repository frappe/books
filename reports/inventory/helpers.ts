import { Fyo } from 'fyo';
import { StockQueue } from 'models/inventory/stockQueue';
import { ValuationMethod } from 'models/inventory/types';
import { ModelNameEnum } from 'models/types';
import { safeParseFloat, safeParseInt } from 'utils/index';
import {
  ComputedStockLedgerEntry,
  RawStockLedgerEntry,
  StockBalanceEntry,
} from './types';

type Item = string;
type Location = string;
type Batch = string;

export async function getRawStockLedgerEntries(fyo: Fyo) {
  const fieldnames = [
    'name',
    'date',
    'item',
    'batch',
    'serialNumber',
    'rate',
    'quantity',
    'location',
    'referenceName',
    'referenceType',
  ];

  return (await fyo.db.getAllRaw(ModelNameEnum.StockLedgerEntry, {
    fields: fieldnames,
    orderBy: ['date', 'created', 'name'],
    order: 'asc',
  })) as RawStockLedgerEntry[];
}

export function getStockLedgerEntries(
  rawSLEs: RawStockLedgerEntry[],
  valuationMethod: ValuationMethod
): ComputedStockLedgerEntry[] {
  const computedSLEs: ComputedStockLedgerEntry[] = [];
  const stockQueues: Record<
    Item,
    Record<Location, Record<Batch, StockQueue>>
  > = {};

  for (const sle of rawSLEs) {
    const name = safeParseInt(sle.name);
    const date = new Date(sle.date);
    const rate = safeParseFloat(sle.rate);
    const { item, location, quantity, referenceName, referenceType } = sle;
    const batch = sle.batch ?? '';
    const serialNumber = sle.serialNumber ?? '';

    if (quantity === 0) {
      continue;
    }

    stockQueues[item] ??= {};
    stockQueues[item][location] ??= {};
    stockQueues[item][location][batch] ??= new StockQueue();

    const q = stockQueues[item][location][batch];
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
    let valuationRate = q.fifo;
    if (valuationMethod === ValuationMethod.MovingAverage) {
      valuationRate = q.movingAverage;
    }

    const balanceValue = q.value;
    const valueChange = balanceValue - initialValue;

    const csle: ComputedStockLedgerEntry = {
      name,
      date,

      item,
      location,
      batch,
      serialNumber,

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

export function getStockBalanceEntries(
  computedSLEs: ComputedStockLedgerEntry[],
  filters: {
    item?: string;
    location?: string;
    fromDate?: string;
    toDate?: string;
    batch?: string;
  }
): StockBalanceEntry[] {
  const sbeMap: Record<
    Item,
    Record<Location, Record<Batch, StockBalanceEntry>>
  > = {};

  const fromDate = filters.fromDate ? Date.parse(filters.fromDate) : null;
  const toDate = filters.toDate ? Date.parse(filters.toDate) : null;

  for (const sle of computedSLEs) {
    if (filters.item && sle.item !== filters.item) {
      continue;
    }

    if (filters.location && sle.location !== filters.location) {
      continue;
    }

    if (filters.batch && sle.batch !== filters.batch) {
      continue;
    }

    const batch = sle.batch || '';

    sbeMap[sle.item] ??= {};
    sbeMap[sle.item][sle.location] ??= {};
    sbeMap[sle.item][sle.location][batch] ??= getSBE(
      sle.item,
      sle.location,
      batch
    );
    const date = sle.date.valueOf();

    if (fromDate && date < fromDate) {
      const sbe = sbeMap[sle.item][sle.location][batch];
      updateOpeningBalances(sbe, sle);
      continue;
    }

    if (toDate && date > toDate) {
      continue;
    }

    const sbe = sbeMap[sle.item][sle.location][batch];
    updateCurrentBalances(sbe, sle);
  }

  return Object.values(sbeMap)
    .map((sbeBatched) =>
      Object.values(sbeBatched).map((sbes) => Object.values(sbes))
    )
    .flat(2);
}

function getSBE(
  item: string,
  location: string,
  batch: string
): StockBalanceEntry {
  return {
    name: 0,

    item,
    location,
    batch,

    balanceQuantity: 0,
    balanceValue: 0,

    openingQuantity: 0,
    openingValue: 0,

    incomingQuantity: 0,
    incomingValue: 0,

    outgoingQuantity: 0,
    outgoingValue: 0,

    valuationRate: 0,
  };
}

function updateOpeningBalances(
  sbe: StockBalanceEntry,
  sle: ComputedStockLedgerEntry
) {
  sbe.openingQuantity += sle.quantity;
  sbe.openingValue += sle.valueChange;

  sbe.balanceQuantity += sle.quantity;
  sbe.balanceValue += sle.valueChange;
}

function updateCurrentBalances(
  sbe: StockBalanceEntry,
  sle: ComputedStockLedgerEntry
) {
  sbe.balanceQuantity += sle.quantity;
  sbe.balanceValue += sle.valueChange;

  if (sle.quantity > 0) {
    sbe.incomingQuantity += sle.quantity;
    sbe.incomingValue += sle.valueChange;
  } else {
    sbe.outgoingQuantity -= sle.quantity;
    sbe.outgoingValue -= sle.valueChange;
  }

  sbe.valuationRate = sle.valuationRate;
}
