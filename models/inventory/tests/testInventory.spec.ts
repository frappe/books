import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import { default as tape, default as test } from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { StockMovement } from '../StockMovement';
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
    MovementTypeEnum.MaterialReceipt,
    new Date('2022-11-03T09:57:04.528'),
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
  t.equal(await fyo.db.getStockQuantity(itemMap.Ink.name), quantity);
});

test('create stock movement, material transfer', async (t) => {
  const { rate } = itemMap.Ink;
  const quantity = 2;

  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialTransfer,
    new Date('2022-11-03T09:58:04.528'),
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

  t.equal(
    await fyo.db.getStockQuantity(itemMap.Ink.name, locationMap.LocationOne),
    0
  );
  t.equal(await fyo.db.getStockQuantity(itemMap.Ink.name), quantity);
});

test('create stock movement, material issue', async (t) => {
  const { rate } = itemMap.Ink;
  const quantity = 2;

  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialIssue,
    new Date('2022-11-03T09:59:04.528'),
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
  t.equal(await fyo.db.getStockQuantity(itemMap.Ink.name), 0);
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

    if (doc.movementType === MovementTypeEnum.MaterialTransfer) {
      t.equal(slesBefore.length, (doc.items?.length ?? 0) * 2);
    } else {
      t.equal(slesBefore.length, doc.items?.length ?? 0);
    }

    await doc.cancel();
    const slesAfter = await getSLEs(name, ModelNameEnum.StockMovement, fyo);
    t.equal(slesAfter.length, 0);
  }

  t.equal(await fyo.db.getStockQuantity(itemMap.Ink.name), null);
});

/**
 * Section 4: Test Invalid entries
 */

async function runEntries(
  item: string,
  entries: {
    type: MovementTypeEnum;
    date: Date;
    valid: boolean;
    postQuantity: number;
    items: {
      item: string;
      to?: string;
      from?: string;
      quantity: number;
      rate: number;
    }[];
  }[],
  t: tape.Test
) {
  for (const { type, date, items, valid, postQuantity } of entries) {
    const stockMovement = await getStockMovement(type, date, items, fyo);
    await stockMovement.sync();

    if (valid) {
      await assertDoesNotThrow(async () => await stockMovement.submit());
    } else {
      await assertThrows(async () => await stockMovement.submit());
    }

    t.equal(await fyo.db.getStockQuantity(item), postQuantity);
  }
}

test('create stock movements, invalid entries, in sequence', async (t) => {
  const { name: item, rate } = itemMap.Pen;
  const quantity = 10;
  await runEntries(
    item,
    [
      {
        type: MovementTypeEnum.MaterialReceipt,
        date: new Date('2022-11-03T09:58:04.528'),
        valid: true,
        postQuantity: quantity,
        items: [
          {
            item,
            to: locationMap.LocationOne,
            quantity,
            rate,
          },
        ],
      },
      {
        type: MovementTypeEnum.MaterialTransfer,
        date: new Date('2022-11-03T09:58:05.528'),
        valid: false,
        postQuantity: quantity,
        items: [
          {
            item,
            from: locationMap.LocationOne,
            to: locationMap.LocationTwo,
            quantity: quantity + 1,
            rate,
          },
        ],
      },
      {
        type: MovementTypeEnum.MaterialIssue,
        date: new Date('2022-11-03T09:58:06.528'),
        valid: false,
        postQuantity: quantity,
        items: [
          {
            item,
            from: locationMap.LocationOne,
            quantity: quantity + 1,
            rate,
          },
        ],
      },
      {
        type: MovementTypeEnum.MaterialTransfer,
        date: new Date('2022-11-03T09:58:07.528'),
        valid: true,
        postQuantity: quantity,
        items: [
          {
            item,
            from: locationMap.LocationOne,
            to: locationMap.LocationTwo,
            quantity,
            rate,
          },
        ],
      },
      {
        type: MovementTypeEnum.MaterialIssue,
        date: new Date('2022-11-03T09:58:08.528'),
        valid: true,
        postQuantity: 0,
        items: [
          {
            item,
            from: locationMap.LocationTwo,
            quantity,
            rate,
          },
        ],
      },
    ],
    t
  );
});

test('create stock movements, invalid entries, out of sequence', async (t) => {
  const { name: item, rate } = itemMap.Ink;
  const quantity = 10;
  await runEntries(
    item,
    [
      {
        type: MovementTypeEnum.MaterialReceipt,
        date: new Date('2022-11-15'),
        valid: true,
        postQuantity: quantity,
        items: [
          {
            item,
            to: locationMap.LocationOne,
            quantity,
            rate,
          },
        ],
      },
      {
        type: MovementTypeEnum.MaterialIssue,
        date: new Date('2022-11-17'),
        valid: true,
        postQuantity: quantity - 5,
        items: [
          {
            item,
            from: locationMap.LocationOne,
            quantity: quantity - 5,
            rate,
          },
        ],
      },
      {
        type: MovementTypeEnum.MaterialTransfer,
        date: new Date('2022-11-16'),
        valid: false,
        postQuantity: quantity - 5,
        items: [
          {
            item,
            from: locationMap.LocationOne,
            to: locationMap.LocationTwo,
            quantity,
            rate,
          },
        ],
      },
    ],
    t
  );
});

closeTestFyo(fyo, __filename);
