import test from 'tape';
import { StockQueue } from '../stockQueue';

test('stockQueue:initialization', (t) => {
  const q = new StockQueue();

  t.equal(q.quantity, 0);
  t.equal(q.value, 0);
  t.equal(q.queue.length, 0);

  t.end();
});

test('stockQueue:operations', (t) => {
  const q = new StockQueue();

  t.equal(q.inward(100, 4), 100);
  t.equal(q.fifo, 100);
  t.equal(q.movingAverage, 100);
  t.equal(q.queue.length, 1);
  t.equal(q.quantity, 4);
  t.equal(q.value, 400);

  t.equal(q.inward(200, 8), 200);
  t.equal(q.fifo, (400 + 1600) / 12);
  t.equal(q.movingAverage, (400 + 1600) / 12);
  t.equal(q.queue.length, 2);
  t.equal(q.quantity, 4 + 8);
  t.equal(q.value, 400 + 1600);

  t.equal(q.inward(300, 3), 300);
  t.equal(q.fifo, (400 + 1600 + 900) / 15);
  t.equal(q.movingAverage, (400 + 1600 + 900) / 15);
  t.equal(q.queue.length, 3);
  t.equal(q.quantity, 4 + 8 + 3);
  t.equal(q.value, 400 + 1600 + 900);

  t.equal(q.outward(3), 100);
  t.equal(q.fifo, (100 + 1600 + 900) / 12);
  t.equal(q.movingAverage, (400 + 1600 + 900) / 15);
  t.equal(q.queue.length, 3);
  t.equal(q.quantity, 1 + 8 + 3);
  t.equal(q.value, 100 + 1600 + 900);

  t.equal(q.outward(5), (100 + 800) / 5);
  t.equal(q.fifo, (800 + 900) / 7);
  t.equal(q.movingAverage, (400 + 1600 + 900) / 15);
  t.equal(q.queue.length, 2);
  t.equal(q.quantity, 4 + 3);
  t.equal(q.value, 800 + 900);

  t.equal(q.outward(4), 200);
  t.equal(q.fifo, 900 / 3);
  t.equal(q.movingAverage, (400 + 1600 + 900) / 15);
  t.equal(q.queue.length, 1);
  t.equal(q.quantity, 3);
  t.equal(q.value, 900);

  t.equal(q.outward(3), 300);
  t.equal(q.fifo, 0);
  t.equal(q.movingAverage, (400 + 1600 + 900) / 15);
  t.equal(q.queue.length, 0);
  t.equal(q.quantity, 0);
  t.equal(q.value, 0);

  t.equal(q.inward(100, 1), 100);
  t.equal(q.fifo, 100);
  t.equal(q.movingAverage, 100);
  t.equal(q.queue.length, 1);
  t.equal(q.quantity, 1);
  t.equal(q.value, 100);

  t.equal(q.inward(150, 1), 150);
  t.equal(q.fifo, (100 + 150) / 2);
  t.equal(q.movingAverage, (100 + 150) / 2);
  t.equal(q.queue.length, 2);
  t.equal(q.quantity, 2);
  t.equal(q.value, 100 + 150);

  t.equal(q.inward(100, 1), 100);
  t.equal(q.fifo, (100 + 150 + 100) / 3);
  t.equal(q.movingAverage, (100 + 150 + 100) / 3);
  t.equal(q.queue.length, 3);
  t.equal(q.quantity, 3);
  t.equal(q.value, 100 + 150 + 100);

  t.equal(q.outward(1), 100);
  t.equal(q.fifo, (150 + 100) / 2);
  t.equal(q.movingAverage, (100 + 150 + 100) / 3);
  t.equal(q.queue.length, 2);
  t.equal(q.quantity, 2);
  t.equal(q.value, 150 + 100);

  t.equal(q.outward(2), (150 + 100) / 2);
  t.equal(q.fifo, 0);
  t.equal(q.movingAverage, (100 + 150 + 100) / 3);
  t.equal(q.queue.length, 0);
  t.equal(q.quantity, 0);
  t.equal(q.value, 0);

  t.end();
});

test('stockQueue:invalidOperations', (t) => {
  const q = new StockQueue();

  t.equal(q.outward(1), null);
  t.equal(q.outward(0), null);
  t.equal(q.outward(-5), null);

  t.equal(q.inward(1000, -1), null);
  t.equal(q.inward(0, 0), null);
  t.equal(q.inward(-0.1, 5), null);

  t.end();
});
