import { assertThrows } from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
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

test('create dummy items, locations & serialNos', async (t) => {
  // Create Items
  for (const { name, rate } of Object.values(itemMap)) {
    const item = getItem(name, rate, false, true);
    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();
  }

  // Create Locations
  for (const name of Object.values(locationMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Location, { name }).sync();
  }

  // Create SerialNos
  for (const serialNo of Object.values(serialNoMap)) {
    const doc = fyo.doc.getNewDoc(ModelNameEnum.SerialNo, serialNo);
    await doc.sync();

    const exists = await fyo.db.exists(ModelNameEnum.SerialNo, serialNo.name);
    t.ok(exists, `${serialNo.name} exists`);
  }
});

test('serialNo enabled item, create stock movement, material receipt', async (t) => {
  const { rate } = itemMap.Pen;
  const stockMovement = await getStockMovement(
    MovementType.MaterialReceipt,
    new Date('2022-11-03T09:57:04.528'),
    [
      {
        item: itemMap.Pen.name,
        to: locationMap.LocationOne,
        quantity: 2,
        serialNo:
          serialNoMap.serialOne.name + '\n' + serialNoMap.serialTwo.name,
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

test('serial item, create stock movement, material issue', async (t) => {
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
closeTestFyo(fyo, __filename);
