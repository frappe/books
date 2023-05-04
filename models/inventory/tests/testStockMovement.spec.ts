import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { getItem } from './helpers';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { MovementTypeEnum } from '../types';
import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';
import { StockMovement } from '../StockMovement';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('check store and create test items', async (t) => {
  const e = await fyo.db.exists(ModelNameEnum.Location, 'Stores');
  t.equals(e, true, 'location Stores exist');

  const items = [
    getItem('RawOne', 100),
    getItem('RawTwo', 100),
    getItem('Final', 200),
  ];

  const exists: boolean[] = [];
  for (const item of items) {
    await fyo.doc.getNewDoc('Item', item).sync();
    exists.push(await fyo.db.exists('Item', item.name));
  }

  t.ok(exists.every(Boolean), 'items created');
});

test('Stock Movement, Material Receipt', async (t) => {
  const sm = fyo.doc.getNewDoc(ModelNameEnum.StockMovement);

  await sm.set({
    date: new Date('2022-01-01'),
    movementType: MovementTypeEnum.MaterialReceipt,
  });

  await sm.append('items', {
    item: 'RawOne',
    quantity: 1,
    rate: 100,
    toLocation: 'Stores',
  });

  await sm.append('items', {
    item: 'RawTwo',
    quantity: 1,
    rate: 100,
    toLocation: 'Stores',
  });

  await assertDoesNotThrow(async () => await sm.sync());
  await assertDoesNotThrow(async () => await sm.submit());

  t.equal(
    await fyo.db.getStockQuantity('RawOne', 'Stores'),
    1,
    'item RawOne added'
  );
  t.equal(
    await fyo.db.getStockQuantity('RawTwo', 'Stores'),
    1,
    'item RawTwo added'
  );
  t.equal(
    await fyo.db.getStockQuantity('Final', 'Stores'),
    null,
    'item Final not yet added'
  );
});

test('Stock Movement, Manufacture', async (t) => {
  const sm = fyo.doc.getNewDoc(ModelNameEnum.StockMovement) as StockMovement;

  await sm.set({
    date: new Date('2022-01-02'),
    movementType: MovementTypeEnum.Manufacture,
  });

  await sm.append('items', {
    item: 'RawOne',
    quantity: 1,
    rate: 100,
  });

  await assertDoesNotThrow(
    async () => await sm.items?.[0].set('fromLocation', 'Stores')
  );
  await assertThrows(
    async () => await sm.items?.[0].set('toLocation', 'Stores')
  );
  t.notOk(sm.items?.[0].to, 'to location not set');

  await sm.append('items', {
    item: 'RawTwo',
    quantity: 1,
    rate: 100,
    fromLocation: 'Stores',
  });

  await assertThrows(async () => await sm.sync());

  await sm.append('items', {
    item: 'Final',
    quantity: 1,
    rate: 100,
    toLocation: 'Stores',
  });

  await assertDoesNotThrow(async () => await sm.sync());
  await assertDoesNotThrow(async () => await sm.submit());

  t.equal(
    await fyo.db.getStockQuantity('RawOne', 'Stores'),
    0,
    'item RawOne removed'
  );

  t.equal(
    await fyo.db.getStockQuantity('RawTwo', 'Stores'),
    0,
    'item RawTwo removed'
  );

  t.equal(
    await fyo.db.getStockQuantity('Final', 'Stores'),
    1,
    'item Final added'
  );
});

closeTestFyo(fyo, __filename);
