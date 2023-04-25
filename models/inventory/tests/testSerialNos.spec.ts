import { assertThrows } from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { MovementType } from '../types';
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

const serialNoMap = {
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

test('create dummy items, locations, party & serialNos', async (t) => {
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

  // Create SerialNos
  for (const serialNo of Object.values(serialNoMap)) {
    const doc = fyo.doc.getNewDoc(ModelNameEnum.SerialNo, serialNo);
    await doc.sync();

    const status = await fyo.getValue(
      ModelNameEnum.SerialNo,
      serialNo.name,
      'status'
    );
    t.equal(
      status,
      'Inactive',
      `${serialNo.name} exists and inital status Inactive`
    );
  }
});

test('serialNo enabled item, create stock movement, material receipt', async (t) => {
  const { rate } = itemMap.Pen;
  const serialNo =
    serialNoMap.serialOne.name + '\n' + serialNoMap.serialTwo.name;
  const stockMovement = await getStockMovement(
    MovementType.MaterialReceipt,
    new Date('2022-11-03T09:57:04.528'),
    [
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 2,
        serialNo,
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
      serialNoMap.serialOne.name
    ),
    1,
    'serialNo one has quantity one'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      serialNoMap.serialTwo.name
    ),
    1,
    'serialNo two has quantity one'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      serialNoMap.serialThree.name
    ),
    null,
    'serialNo three has no quantity'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Ink.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      serialNoMap.serialOne.name
    ),
    null,
    'non transacted item has no quantity'
  );
});

test('serialNo enabled item, create stock movement, material issue', async (t) => {
  const { rate } = itemMap.Pen;
  const quantity = 1;

  const stockMovement = await getStockMovement(
    MovementType.MaterialIssue,
    new Date('2022-11-03T10:00:00.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        serialNo: serialNoMap.serialOne.name,
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
      serialNoMap.serialOne.name
    ),
    0,
    'serialNo one quantity transacted out'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      serialNoMap.serialTwo.name
    ),
    1,
    'serialNo two quantity intact'
  );
});

test('serialNo enabled item, create stock movement, material transfer', async (t) => {
  const { rate } = itemMap.Pen;
  const quantity = 1;
  const serialNo = serialNoMap.serialTwo.name;

  const stockMovement = await getStockMovement(
    MovementType.MaterialTransfer,
    new Date('2022-11-03T09:58:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        to: locationMap.LocationTwo,
        serialNo,
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
      serialNo
    ),
    0,
    'location one serialNoTwo transacted out'
  );

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationTwo,
      undefined,
      undefined,
      undefined,
      serialNo
    ),
    quantity,
    'location two serialNo transacted in'
  );
});

test('serialNo enabled item, create invalid stock movements', async (t) => {
  const { name, rate } = itemMap.Pen;
  const quantity = await fyo.db.getStockQuantity(
    itemMap.Pen.name,
    locationMap.LocationTwo,
    undefined,
    undefined,
    undefined,
    serialNoMap.serialTwo.name
  );

  t.equal(quantity, 1, 'location two, serialNo one has quantity');
  if (!quantity) {
    return;
  }

  let stockMovement = await getStockMovement(
    MovementType.MaterialIssue,
    new Date('2022-11-03T09:59:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationTwo,
        serialNo: serialNoMap.serialOne.name,
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
    MovementType.MaterialIssue,
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
    'invalid stockMovement without serialNo did not throw'
  );
  t.equal(await fyo.db.getStockQuantity(name), 1, 'item still has quantity');
});

closeTestFyo(fyo, __filename);
