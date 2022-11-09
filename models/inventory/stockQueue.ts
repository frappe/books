export class StockQueue {
  quantity: number;
  value: number;
  queue: { rate: number; quantity: number }[];
  movingAverage: number;

  constructor() {
    this.value = 0;
    this.quantity = 0;
    this.movingAverage = 0;
    this.queue = [];
  }

  get fifo() {
    /**
     * Stock value maintained is based on the stock queue
     * ∴ FIFO by default. This returns FIFO valuation rate.
     */
    const valuation = this.value / this.quantity;
    if (Number.isNaN(valuation)) {
      return 0;
    }

    return valuation;
  }

  inward(rate: number, quantity: number): null | number {
    if (quantity <= 0 || rate < 0) {
      return null;
    }

    const inwardValue = rate * quantity;
    /**
     * Update Moving Average valuation
     */
    this.movingAverage =
      (this.movingAverage * this.quantity + inwardValue) /
      (this.quantity + quantity);

    this.quantity += quantity;
    this.value += inwardValue;

    const last = this.queue.at(-1);
    if (last?.rate !== rate) {
      this.queue.push({ rate, quantity });
    } else {
      last.quantity += quantity;
    }

    return rate;
  }

  outward(quantity: number): null | number {
    if (this.quantity < quantity || quantity <= 0) {
      return null;
    }

    let incomingRate: number = 0;
    this.quantity -= quantity;
    let remaining = quantity;

    while (remaining > 0) {
      const last = this.queue.shift();
      if (last === undefined) {
        return null;
      }

      const storedQuantity = last.quantity;
      let quantityRemoved = remaining;

      const quantityLeft = storedQuantity - remaining;
      remaining = remaining - storedQuantity;

      if (remaining > 0) {
        quantityRemoved = storedQuantity;
      }

      if (quantityLeft > 0) {
        this.queue.unshift({ rate: last.rate, quantity: quantityLeft });
      }

      this.value -= last.rate * quantityRemoved;
      incomingRate += quantityRemoved * last.rate;
    }

    return incomingRate / quantity;
  }
}
