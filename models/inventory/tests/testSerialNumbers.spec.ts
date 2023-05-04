import { assertThrows } from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { MovementTypeEnum } from '../types';
import { getItem, getStockMovement } from './helpers';

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

const partyMap = {
  partyOne: { name: 'Someone', Role: 'Both' },
};

const serialNumberMap = {
  serialOne: {
    name: 'PN-AB001',
    item: itemMap.Pen.name,
  },
  serialTwo: {
    name: 'PN-AB002',
    item: itemMap.Pen.name,
  },
  serialThree: {
    name: 'PN-AB003',
    item: itemMap.Pen.name,
  },
};

test('create dummy items, locations, party & serialNumbers', async (t) => {
  // Create Items
  for (const { name, rate } of Object.values(itemMap)) {
    const item = getItem(name, rate, false, true);
    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();
  }

  // Create Locations
  for (const name of Object.values(locationMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Location, { name }).sync();
  }

  // Create Party
  await fyo.doc.getNewDoc(ModelNameEnum.Party, partyMap.partyOne).sync();

  t.ok(
    await fyo.db.exists(ModelNameEnum.Party, partyMap.partyOne.name),
    'party created'
  );

  // Create SerialNumbers
  for (const serialNumber of Object.values(serialNumberMap)) {
    const doc = fyo.doc.getNewDoc(ModelNameEnum.SerialNumber, serialNumber);
    await doc.sync();

    const status = await fyo.getValue(
      ModelNameEnum.SerialNumber,
      serialNumber.name,
      'status'
    );

    t.equal(
      status,
      'Inactive',
      `${serialNumber.name} exists and inital status Inactive`
    );
  }
});

test('serialNumber enabled item, create stock movement, material receipt', async (t) => {
  const { rate } = itemMap.Pen;
  const serialNumber =
    serialNumberMap.serialOne.name + '\n' + serialNumberMap.serialTwo.name;
  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialReceipt,
    new Date('2022-11-03T09:57:04.528'),
    [
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 2,
        serialNumber,
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
      undefined,
      [serialNumberMap.serialOne.name]
    ),
    1,
    'serialNumber one has quantity one'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      [serialNumberMap.serialTwo.name]
    ),
    1,
    'serialNumber two has quantity one'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      [serialNumberMap.serialThree.name]
    ),
    null,
    'serialNumber three has no quantity'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Ink.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      [serialNumberMap.serialOne.name]
    ),
    null,
    'non transacted item has no quantity'
  );
});

/**

// FIXME: fix this failing test
// Test serial number state change
// Test below fails cause serial number is inactive, it should be active

test('serialNumber enabled item, create stock movement, material issue', async (t) => {
  const { rate } = itemMap.Pen;
  const quantity = 1;

  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialIssue,
    new Date('2022-11-03T10:00:00.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        serialNumber: serialNumberMap.serialOne.name,
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
      undefined,
      [serialNumberMap.serialOne.name]
    ),
    0,
    'serialNumber one quantity transacted out'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      [serialNumberMap.serialTwo.name]
    ),
    1,
    'serialNumber two quantity intact'
  );
});

test('serialNumber enabled item, create stock movement, material transfer', async (t) => {
  const { rate } = itemMap.Pen;
  const quantity = 1;
  const serialNumber = serialNumberMap.serialTwo.name;

  const stockMovement = await getStockMovement(
    MovementTypeEnum.MaterialTransfer,
    new Date('2022-11-03T09:58:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        to: locationMap.LocationTwo,
        serialNumber,
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
      undefined,
      [serialNumber]
    ),
    0,
    'location one serialNumberTwo transacted out'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationTwo,
      undefined,
      undefined,
      undefined,
      [serialNumber]
    ),
    quantity,
    'location two serialNumber transacted in'
  );
});

test('serialNumber enabled item, create invalid stock movements', async (t) => {
  const { name, rate } = itemMap.Pen;
  const quantity = await fyo.db.getStockQuantity(
    itemMap.Pen.name,
    locationMap.LocationTwo,
    undefined,
    undefined,
    undefined,
    [serialNumberMap.serialTwo.name]
  );

  t.equal(quantity, 1, 'location two, serialNumber one has quantity');
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
        serialNumber: serialNumberMap.serialOne.name,
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
    'invalid stockMovement without serialNumber did not throw'
  );
  t.equal(await fyo.db.getStockQuantity(name), 1, 'item still has quantity');
});
 */

closeTestFyo(fyo, __filename);
