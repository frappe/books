import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { getSerialNumbers } from '../helpers';
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

  const statusOne = await fyo.getValue(
    ModelNameEnum.SerialNumber,
    serialNumberMap.serialOne.name,
    'status'
  );
  t.equal(statusOne, 'Active', `serialNumber one is Active`);

  const statusTwo = await fyo.getValue(
    ModelNameEnum.SerialNumber,
    serialNumberMap.serialOne.name,
    'status'
  );

  t.equal(statusTwo, 'Active', 'serialNumber two is Active');
});

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

test('Material Receipt, auto creation of Serial Number', async (t) => {
  const serialNumber = `001\n002\n003`;
  const serialNumbers = getSerialNumbers(serialNumber);
  for (const sn of serialNumbers) {
    t.equal(
      await fyo.db.exists(ModelNameEnum.SerialNumber, sn),
      false,
      `Serial Number${sn} does not exist`
    );
  }

  const doc = await getStockMovement(
    MovementTypeEnum.MaterialReceipt,
    new Date('2022-11-04T09:59:04.528'),
    [
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 3,
        rate: 100,
        serialNumber,
      },
    ],
    fyo
  );

  await (await doc.sync()).submit();
  for (const sn of serialNumbers) {
    await assertDoesNotThrow(async () => {
      const sndoc = await fyo.doc.getDoc(ModelNameEnum.SerialNumber, sn);
      t.equal(sndoc.status, 'Active', `Serial Number ${sn} updated to Active`);
    }, `SerialNumber ${sn} exists`);
  }

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      serialNumbers
    ),
    3,
    'location one has quantity 3 of incoming serialNumbers'
  );
});

test('Material Issue, status change of Serial Number', async (t) => {
  const serialNumber = `001\n002\n003`;
  const serialNumbers = getSerialNumbers(serialNumber);
  for (const sn of serialNumbers) {
    t.equal(
      await fyo.db.exists(ModelNameEnum.SerialNumber, sn),
      true,
      `Serial Number${sn} exists`
    );
  }

  const doc = await getStockMovement(
    MovementTypeEnum.MaterialIssue,
    new Date('2022-11-05T09:59:04.528'),
    [
      {
        item: itemMap.Pen.name,
        from: locationMap.LocationOne,
        quantity: 3,
        rate: 100,
        serialNumber,
      },
    ],
    fyo
  );

  await (await doc.sync()).submit();
  for (const sn of serialNumbers) {
    const status = await fyo.getValue(ModelNameEnum.SerialNumber, sn, 'status');
    t.equal(status, 'Delivered', `Serial Number ${sn} updated to Delivered`);
  }

  t.equal(
    await fyo.db.getStockQuantity(
      itemMap.Pen.name,
      locationMap.LocationOne,
      undefined,
      undefined,
      undefined,
      serialNumbers
    ),
    0,
    'location one has quantity 0 of serialNumbers after issue'
  );

  await doc.cancel();
  for (const sn of serialNumbers) {
    const status = await fyo.getValue(ModelNameEnum.SerialNumber, sn, 'status');
    t.equal(
      status,
      'Active',
      `Serial Number ${sn} updated to Active post cancel`
    );
  }
});

test('Material Receipt cancellation, Serial Number status update', async (t) => {
  const serialNumber = `004\n005\n006`;
  const serialNumbers = getSerialNumbers(serialNumber);
  const doc = await getStockMovement(
    MovementTypeEnum.MaterialReceipt,
    new Date('2022-11-04T09:59:04.528'),
    [
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 3,
        rate: 100,
        serialNumber,
      },
    ],
    fyo
  );

  await (await doc.sync()).submit();
  for (const sn of serialNumbers) {
    const status = await fyo.getValue(ModelNameEnum.SerialNumber, sn, 'status');
    t.equal(
      status,
      'Active',
      `Serial Number ${sn} updated to Active after submit`
    );
  }

  await doc.cancel();
  for (const sn of serialNumbers) {
    const status = await fyo.getValue(ModelNameEnum.SerialNumber, sn, 'status');
    t.equal(
      status,
      'Inactive',
      `Serial Number ${sn} updated to InActive after cancel`
    );
  }
});

closeTestFyo(fyo, __filename);
