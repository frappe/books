import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { StockMovement } from '../StockMovement';
import { MovementType } from '../types';

type SLE = {
  date: string;
  name: string;
  item: string;
  location: string;
  rate: string;
  quantity: string;
};

type Transfer = {
  item: string;
  from?: string;
  to?: string;
  quantity: number;
  rate: number;
};

export function getItem(name: string, rate: number) {
  return { name, rate, trackItem: true };
}

export async function getStockMovement(
  movementType: MovementType,
  transfers: Transfer[],
  fyo: Fyo
): Promise<StockMovement> {
  const doc = fyo.doc.getNewDoc(ModelNameEnum.StockMovement, {
    movementType,
  }) as StockMovement;

  for (const {
    item,
    from: fromLocation,
    to: toLocation,
    quantity,
    rate,
  } of transfers) {
    await doc.append('items', {
      item,
      fromLocation,
      toLocation,
      rate,
      quantity,
    });
  }

  return doc;
}

export async function getSLEs(
  referenceName: string,
  referenceType: string,
  fyo: Fyo
) {
  return (await fyo.db.getAllRaw(ModelNameEnum.StockLedgerEntry, {
    filters: { referenceName, referenceType },
    fields: ['date', 'name', 'item', 'location', 'rate', 'quantity'],
  })) as SLE[];
}
