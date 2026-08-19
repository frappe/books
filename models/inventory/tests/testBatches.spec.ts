import { assertThrows } from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { MovementTypeEnum } from '../types';
import { getItem, getSLEs, getStockMovement } from './helpers';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

const itemMap = {
  Pen: {
    name: 'Pen',
    rate: 700,
  },
  Ink: {
    name: 'Ink',
    rate: 50,
  },
};

const locationMap = {
  LocationOne: 'LocationOne',
  LocationTwo: 'LocationTwo',
};

const batchMap = {
  batchOne: {
    name: 'PN-AB001',
    manufactureDate: '2022-11-03T09:57:04.528',
  },
  batchTwo: {
    name: 'PN-AB002',
    manufactureDate: '2022-10-03T09:57:04.528',
  },
  batchThree: {
    name: 'PN-AB003',
    manufactureDate: '2022-10-03T09:57:04.528',
  },
};

test('create dummy items, locations & batches', async (t) => {
  // Create Items
  for (const { name, rate } of Object.values(itemMap)) {
    const item = getItem(name, rate, true);
    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();
  }

  // Create Locations
  for (const name of Object.values(locationMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Location, { name }).sync();
  }

  // Create Batches
  for (const batch of Object.values(batchMap)) {
    const doc = fyo.doc.getNewDoc(ModelNameEnum.Batch, batch);
    await doc.sync();

    const exists = await fyo.db.exists(ModelNameEnum.Batch, batch.name);
    t.ok(exists, `${batch.name} exists`);
  }
});

test('batched item, create stock movement, material receipt', async (t) => {
  const { rate } = itemMap.Pen;
  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialReceipt,
    new Date('2022-11-03T09:57:04.528'),
    [
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 2,
        batch: batchMap.batchOne.name,
        rate,
      },
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 1,
        batch: batchMap.batchTwo.name,
        rate,
      },
    ],
    fyo
  );

  await (await stockMovement.sync()).submit();
  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batchMap.batchOne.name
    ),
    2,
    'batch one has quantity two'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batchMap.batchTwo.name
    ),
    1,
    'batch two has quantity one'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batchMap.batchThree.name
    ),
    null,
    'batch three has no quantity'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Ink.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batchMap.batchOne.name
    ),
    null,
    'non transacted item has no quantity'
  );
});

test('batched item, create stock movement, material issue', async (t) => {
  const { rate } = itemMap.Pen;
  const quantity = 2;
  const batch = batchMap.batchOne.name;

  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialIssue,
    new Date('2022-11-03T10:00:00.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        batch,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await (await stockMovement.sync()).submit();
  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batch
    ),
    0,
    'batch one quantity transacted out'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batchMap.batchTwo.name
    ),
    1,
    'batch two quantity intact'
  );
});

test('batched item, create stock movement, material transfer', async (t) => {
  const { rate } = itemMap.Pen;
  const quantity = 1;
  const batch = batchMap.batchTwo.name;

  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialTransfer,
    new Date('2022-11-03T09:58:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        to: locationMap.LocationTwo,
        batch,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await (await stockMovement.sync()).submit();
  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      batch
    ),
    0,
    'location one batch transacted out'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationTwo,
      undefined,
      undefined,
      batch
    ),
    quantity,
    'location two batch transacted in'
  );
});

test('batched item, create invalid stock movements', async (t) => {
  const { name, rate } = itemMap.Pen;
  const quantity = await fyo.db.getStockQuantity(
    itemMap.Pen.name,
    locationMap.LocationTwo,
    undefined,
    undefined,
    batchMap.batchTwo.name
  );

  t.equal(quantity, 1, 'location two, batch one has quantity');
  if (!quantity) {
    return;
  }

  let stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialIssue,
    new Date('2022-11-03T09:59:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationTwo,
        batch: batchMap.batchOne.name,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await assertThrows(
    async () => (await stockMovement.sync()).submit(),
    'invalid stockMovement with insufficient quantity did not throw'
  );

  stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialIssue,
    new Date('2022-11-03T09:59:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationTwo,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await assertThrows(
    async () => (await stockMovement.sync()).submit(),
    'invalid stockMovement without batch did not throw'
  );
  t.equal(await fyo.db.getStockQuantity(name), 1, 'item still has quantity');
});

closeTestFyo(fyo, __filename);
