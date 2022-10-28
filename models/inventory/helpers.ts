import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { StockQueue } from './StockQueue';

export async function getStockQueue(
  item: string,
  location: string,
  fyo: Fyo
): Promise<StockQueue> {
  /**
   * Create a new StockQueue if it doesn't exist.
   */

  const names = (await fyo.db.getAllRaw(ModelNameEnum.StockQueue, {
    filters: { item, location },
    fields: ['name'],
    limit: 1,
  })) as { name: string }[];
  const name = names?.[0]?.name;

  if (!name) {
    return fyo.doc.getNewDoc(ModelNameEnum.StockQueue, {
      item,
      location,
    }) as StockQueue;
  }

  return (await fyo.doc.getDoc(ModelNameEnum.StockQueue, name)) as StockQueue;
}
