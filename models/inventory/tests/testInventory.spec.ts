import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { StockMovement } from '../StockMovement';
import { MovementType } from '../types';
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

/**
 * Section 1: Test Creation of Items and Locations
 */

test('create dummy items & locations', async (t) => {
  // Create Items
  for (const { name, rate } of Object.values(itemMap)) {
    const item = getItem(name, rate);
    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();
    t.ok(await fyo.db.exists(ModelNameEnum.Item, name), `${name} exists`);
  }

  // Create Locations
  for (const name of Object.values(locationMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Location, { name }).sync();
    t.ok(await fyo.db.exists(ModelNameEnum.Location, name), `${name} exists`);
  }
});

/**
 * Section 2: Test Creation of Stock Movements
 */

test('create stock movement, material receipt', async (t) => {
  const { rate } = itemMap.Ink;
  const quantity = 2;
  const amount = rate * quantity;
  const stockMovement = await getStockMovement(
    MovementType.MaterialReceipt,
    [
      {
        item: itemMap.Ink.name,
        to: locationMap.LocationOne,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await (await stockMovement.sync()).submit();
  t.ok(stockMovement.name?.startsWith('SMOV-'));
  t.equal(stockMovement.amount?.float, amount);
  t.equal(stockMovement.items?.[0].amount?.float, amount);

  const name = stockMovement.name!;

  const sles = await getSLEs(name, ModelNameEnum.StockMovement, fyo);
  t.equal(sles.length, 1);

  const sle = sles[0];
  t.notEqual(new Date(sle.date).toString(), 'Invalid Date');
  t.equal(parseInt(sle.name), 1);
  t.equal(sle.item, itemMap.Ink.name);
  t.equal(parseFloat(sle.rate), rate);
  t.equal(sle.quantity, quantity);
  t.equal(sle.location, locationMap.LocationOne);
});

test('create stock movement, material transfer', async (t) => {
  const { rate } = itemMap.Ink;
  const quantity = 2;

  const stockMovement = await getStockMovement(
    MovementType.MaterialTransfer,
    [
      {
        item: itemMap.Ink.name,
        from: locationMap.LocationOne,
        to: locationMap.LocationTwo,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await (await stockMovement.sync()).submit();
  const name = stockMovement.name!;

  const sles = await getSLEs(name, ModelNameEnum.StockMovement, fyo);
  t.equal(sles.length, 2);

  for (const sle of sles) {
    t.notEqual(new Date(sle.date).toString(), 'Invalid Date');
    t.equal(sle.item, itemMap.Ink.name);
    t.equal(parseFloat(sle.rate), rate);

    if (sle.location === locationMap.LocationOne) {
      t.equal(sle.quantity, -quantity);
    } else if (sle.location === locationMap.LocationTwo) {
      t.equal(sle.quantity, quantity);
    } else {
      t.ok(false, 'no-op');
    }
  }
});

test('create stock movement, material issue', async (t) => {
  const { rate } = itemMap.Ink;
  const quantity = 2;

  const stockMovement = await getStockMovement(
    MovementType.MaterialIssue,
    [
      {
        item: itemMap.Ink.name,
        from: locationMap.LocationTwo,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await (await stockMovement.sync()).submit();
  const name = stockMovement.name!;

  const sles = await getSLEs(name, ModelNameEnum.StockMovement, fyo);
  t.equal(sles.length, 1);

  const sle = sles[0];
  t.notEqual(new Date(sle.date).toString(), 'Invalid Date');
  t.equal(sle.item, itemMap.Ink.name);
  t.equal(parseFloat(sle.rate), rate);
  t.equal(sle.quantity, -quantity);
  t.equal(sle.location, locationMap.LocationTwo);
});

/**
 * Section 3: Test Cancellation of Stock Movements
 */

test('cancel stock movement', async (t) => {
  const names = (await fyo.db.getAllRaw(ModelNameEnum.StockMovement)) as {
    name: string;
  }[];

  for (const { name } of names) {
    const slesBefore = await getSLEs(name, ModelNameEnum.StockMovement, fyo);
    const doc = (await fyo.doc.getDoc(
      ModelNameEnum.StockMovement,
      name
    )) as StockMovement;

    if (doc.movementType === MovementType.MaterialTransfer) {
      t.equal(slesBefore.length, (doc.items?.length ?? 0) * 2);
    } else {
      t.equal(slesBefore.length, doc.items?.length ?? 0);
    }

    await doc.cancel();
    const slesAfter = await getSLEs(name, ModelNameEnum.StockMovement, fyo);
    t.equal(slesAfter.length, 0);
  }
});

/**
 * Section 4: Test Invalid entries
 */

closeTestFyo(fyo, __filename);
