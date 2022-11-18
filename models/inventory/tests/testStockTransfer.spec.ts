import {
  assertDoesNotThrow,
  assertThrows
} from 'backend/database/tests/helpers';
import { ModelNameEnum } from 'models/types';
import { RawValue } from 'schemas/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { InventorySettings } from '../InventorySettings';
import { ValuationMethod } from '../types';
import { getALEs, getItem, getSLEs, getStockTransfer } from './helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const item = 'Pen';
const location = 'Common';
const party = 'Someone';
const testDocs = {
  Item: {
    [item]: getItem(item, 100),
  },
  Location: {
    [location]: { name: location },
  },
  Party: { [party]: { name: party, Role: 'Both' } },
} as Record<string, Record<string, { name: string; [key: string]: RawValue }>>;

test('insert test docs', async (t) => {
  for (const schemaName in testDocs) {
    for (const name in testDocs[schemaName]) {
      await fyo.doc.getNewDoc(schemaName, testDocs[schemaName][name]).sync();
    }
  }

  t.ok(await fyo.db.exists(ModelNameEnum.Party, party), 'party created');
  t.ok(
    await fyo.db.exists(ModelNameEnum.Location, location),
    'location created'
  );
  t.ok(await fyo.db.exists(ModelNameEnum.Item, item), 'item created');
});

test('inventory settings', async (t) => {
  const doc = (await fyo.doc.getDoc(
    ModelNameEnum.InventorySettings
  )) as InventorySettings;

  t.equal(doc.valuationMethod, ValuationMethod.FIFO, 'fifo valuation set');
  t.ok(doc.stockInHand, 'stock in hand set');
  t.ok(doc.stockReceivedButNotBilled, 'stock rec. but not billed set');
});

test('PurchaseReceipt, create inward stock movement', async (t) => {
  const date = new Date('2022-01-01');
  const rate = (testDocs['Item'][item].rate as number) ?? 0;
  const quantity = 10;
  const doc = await getStockTransfer(
    ModelNameEnum.PurchaseReceipt,
    party,
    date,
    [
      {
        item,
        location,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await doc.sync();
  const grandTotal = quantity * rate;
  t.equal(doc.grandTotal?.float, quantity * rate);

  await doc.submit();

  t.equal(
    (await fyo.db.getAllRaw(ModelNameEnum.PurchaseReceipt)).length,
    1,
    'purchase receipt created'
  );
  t.equal(
    (await getSLEs(doc.name!, doc.schemaName, fyo)).length,
    1,
    'sle created'
  );
  t.equal(
    await fyo.db.getStockQuantity(item, location),
    quantity,
    'stock purchased'
  );
  t.ok(doc.name?.startsWith('PREC-'));

  const ales = await getALEs(doc.name!, doc.schemaName, fyo);
  for (const ale of ales) {
    t.equal(ale.party, party, 'party matches');
    if (ale.account === 'Stock Received But Not Billed') {
      t.equal(parseFloat(ale.debit), 0);
      t.equal(parseFloat(ale.credit), grandTotal);
    } else {
      t.equal(parseFloat(ale.credit), 0);
      t.equal(parseFloat(ale.debit), grandTotal);
    }
  }
});

test('Shipment, create outward stock movement', async (t) => {
  const date = new Date('2022-01-02');
  const rate = (testDocs['Item'][item].rate as number) ?? 0;
  const quantity = 5;
  const doc = await getStockTransfer(
    ModelNameEnum.Shipment,
    party,
    date,
    [
      {
        item,
        location,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await doc.sync();
  const grandTotal = quantity * rate;
  t.equal(doc.grandTotal?.float, grandTotal);

  await doc.submit();

  t.equal(
    (await fyo.db.getAllRaw(ModelNameEnum.Shipment)).length,
    1,
    'shipment created'
  );
  t.equal(
    (await getSLEs(doc.name!, doc.schemaName, fyo)).length,
    1,
    'sle created'
  );
  t.equal(
    await fyo.db.getStockQuantity(item, location),
    10 - quantity,
    'stock purchased'
  );
  t.ok(doc.name?.startsWith('SHPM-'));

  const ales = await getALEs(doc.name!, doc.schemaName, fyo);
  for (const ale of ales) {
    t.equal(ale.party, party, 'party matches');
    if (ale.account === 'Cost of Goods Sold') {
      t.equal(parseFloat(ale.debit), grandTotal);
      t.equal(parseFloat(ale.credit), 0);
    } else {
      t.equal(parseFloat(ale.debit), 0);
      t.equal(parseFloat(ale.credit), grandTotal);
    }
  }
});

test('Shipment, invalid', async (t) => {
  const date = new Date('2022-01-03');
  const rate = (testDocs['Item'][item].rate as number) ?? 0;
  const quantity = 10;
  const doc = await getStockTransfer(
    ModelNameEnum.Shipment,
    party,
    date,
    [
      {
        item,
        location,
        quantity,
        rate,
      },
    ],
    fyo
  );

  await doc.sync();
  const grandTotal = quantity * rate;

  t.equal(await fyo.db.getStockQuantity(item, location), 5, 'stock unchanged');
  t.equal(doc.grandTotal?.float, grandTotal);
  await assertThrows(async () => await doc.submit());

  t.equal(
    (await getSLEs(doc.name!, doc.schemaName, fyo)).length,
    0,
    'sles not created'
  );
  t.equal(
    (await getALEs(doc.name!, doc.schemaName, fyo)).length,
    0,
    'ales not created'
  );
});

test('Stock Transfer, invalid cancellation', async (t) => {
  const { name } =
    (
      (await fyo.db.getAllRaw(ModelNameEnum.PurchaseReceipt)) as {
        name: string;
      }[]
    )[0] ?? {};

  t.ok(name?.startsWith('PREC-'));
  const doc = await fyo.doc.getDoc(ModelNameEnum.PurchaseReceipt, name);
  await assertThrows(async () => await doc.cancel());
  t.equal(await fyo.db.getStockQuantity(item, location), 5, 'stock unchanged');
  t.equal(
    (await getSLEs(name, doc.schemaName, fyo)).length,
    1,
    'sle unchanged'
  );
  const ales = await getALEs(name, doc.schemaName, fyo);
  t.ok(ales.every((i) => !i.reverted) && ales.length === 2, 'ale unchanged');
});

test('Shipment, cancel and delete', async (t) => {
  const { name } =
    (
      (await fyo.db.getAllRaw(ModelNameEnum.Shipment, { order: 'asc' })) as {
        name: string;
      }[]
    )[0] ?? {};

  t.ok(name?.startsWith('SHPM-'), 'number series matches');
  const doc = await fyo.doc.getDoc(ModelNameEnum.Shipment, name);
  t.ok(doc.isSubmitted, `doc ${name} is submitted`);
  await assertDoesNotThrow(async () => await doc.cancel());
  t.ok(doc.isCancelled), `doc is cancelled`;

  t.equal(await fyo.db.getStockQuantity(item, location), 10, 'stock changed');
  t.equal((await getSLEs(name, doc.schemaName, fyo)).length, 0, 'sle deleted');
  const ales = await getALEs(name, doc.schemaName, fyo);
  t.ok(ales.every((i) => !!i.reverted) && ales.length === 4, 'ale reverted');

  await doc.delete();
  t.equal((await getALEs(name, doc.schemaName, fyo)).length, 0, 'ales deleted');
  t.equal(
    (
      await fyo.db.getAllRaw(ModelNameEnum.Shipment, {
        filters: { name: name },
      })
    ).length,
    0,
    'doc deleted'
  );
});

test('Purchase Receipt, cancel and delete', async (t) => {
  const { name } =
    (
      (await fyo.db.getAllRaw(ModelNameEnum.PurchaseReceipt, {
        order: 'asc',
      })) as {
        name: string;
      }[]
    )[0] ?? {};

  t.ok(name?.startsWith('PREC-'), 'number series matches');
  const doc = await fyo.doc.getDoc(ModelNameEnum.PurchaseReceipt, name);
  t.ok(doc.isSubmitted, `doc ${name} is submitted`);
  await assertDoesNotThrow(async () => await doc.cancel());
  t.ok(doc.isCancelled), `doc is cancelled`;

  t.equal(await fyo.db.getStockQuantity(item, location), null, 'stock changed');
  t.equal((await getSLEs(name, doc.schemaName, fyo)).length, 0, 'sle deleted');
  const ales = await getALEs(name, doc.schemaName, fyo);
  t.ok(ales.every((i) => !!i.reverted) && ales.length === 4, 'ale reverted');

  await doc.delete();
  t.equal((await getALEs(name, doc.schemaName, fyo)).length, 0, 'ales deleted');
  t.equal(
    (
      await fyo.db.getAllRaw(ModelNameEnum.Shipment, {
        filters: { name: name },
      })
    ).length,
    0,
    'doc deleted'
  );
});
closeTestFyo(fyo, __filename);
