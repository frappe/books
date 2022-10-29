import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';
import { StockQueueItem } from './types';

export class StockQueue extends Doc {
  item?: string;
  location?: string;
  queue?: string;
  stockValue?: Money;

  /**
   * Stock Queue
   *
   * Used to keep track of inward rates for stock
   * valuation purposes.
   *
   * Stock Queue uses autoincrement as PK as opposed
   * to (item, location, ...) to prevent NULL value
   * primary keys.
   */

  get quantity(): number {
    return this.stockQueue.reduce((qty, sqi) => {
      return qty + sqi.quantity;
    }, 0);
  }

  get stockQueue(): StockQueueItem[] {
    const stringifiedRatesQueue = JSON.parse(this.queue ?? '[]') as {
      rate: string;
      quantity: number;
    }[];

    return stringifiedRatesQueue.map(({ rate, quantity }) => ({
      rate: this.fyo.pesa(rate),
      quantity,
    }));
  }

  set stockQueue(stockQueue: StockQueueItem[]) {
    const stringifiedRatesQueue = stockQueue.map(({ rate, quantity }) => ({
      rate: rate.store,
      quantity,
    }));
    this.queue = JSON.stringify(stringifiedRatesQueue);
  }

  inward(rate: Money, quantity: number): boolean {
    const stockQueue = this.stockQueue;
    stockQueue.push({ rate, quantity });
    this.stockQueue = stockQueue;

    this._updateStockValue(stockQueue);
    return true;
  }

  outward(quantity: number): boolean {
    const stockQueue = this.stockQueue;
    const outwardQueues = getQueuesPostOutwards(stockQueue, quantity);
    if (!outwardQueues.isPossible) {
      return false;
    }

    this.stockQueue = outwardQueues.balanceQueue;
    this._updateStockValue(outwardQueues.balanceQueue);
    return true;
  }

  _updateStockValue(stockQueue: StockQueueItem[]) {
    this.stockValue = stockQueue.reduce((acc, { rate, quantity }) => {
      return acc.add(rate.mul(quantity));
    }, this.fyo.pesa(0));
  }
}

function getQueuesPostOutwards(
  stockQueue: StockQueueItem[],
  outwardQuantity: number
) {
  const totalQuantity = stockQueue.reduce(
    (acc, { quantity }) => acc + quantity,
    0
  );

  const isPossible = outwardQuantity <= totalQuantity;
  if (!isPossible) {
    return { isPossible };
  }

  let outwardRemaining = outwardQuantity;
  const balanceQueue: StockQueueItem[] = [];
  const outwardQueue: StockQueueItem[] = [];

  for (let i = stockQueue.length - 1; i >= 0; i--) {
    const { quantity, rate } = stockQueue[i];
    if (outwardRemaining === 0) {
      balanceQueue.unshift({ quantity, rate });
    }

    const balanceRemaining = quantity - outwardRemaining;
    if (balanceRemaining === 0) {
      outwardQueue.push({ quantity, rate });
      outwardRemaining = 0;
      continue;
    }

    if (balanceRemaining > 0) {
      outwardQueue.push({ quantity: outwardRemaining, rate });
      balanceQueue.unshift({ quantity: balanceRemaining, rate });
      outwardRemaining = 0;
      continue;
    }

    if (balanceRemaining < 0) {
      outwardQueue.push({ quantity, rate });
      outwardRemaining = +balanceRemaining;
      continue;
    }
  }

  return { isPossible, outwardQueue, balanceQueue };
}
