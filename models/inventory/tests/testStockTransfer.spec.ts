import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { ModelNameEnum } from 'models/types';
import { RawValue } from 'schemas/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { InventorySettings } from '../InventorySettings';
import { Shipment } from '../Shipment';
import { StockTransfer } from '../StockTransfer';
import { ValuationMethod } from '../types';
import { getALEs, getItem, getSLEs, getStockTransfer } from './helpers';
import { Money } from 'pesa';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { PurchaseInvoice } from 'models/baseModels/PurchaseInvoice/PurchaseInvoice';
import { PaymentTypeEnum } from 'models/baseModels/Payment/types';

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

test('Purchase Invoice then Purchase Receipt', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const quantity = 3;
  const pinv = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice) as Invoice;

  const date = new Date('2022-01-04');
  await pinv.set({
    date,
    party,
    account: 'Creditors',
  });
  await pinv.append('items', { item, quantity, rate });
  await pinv.sync();
  await pinv.submit();

  t.equal(pinv.name, 'PINV-1001', 'PINV name matches');
  t.equal(pinv.stockNotTransferred, quantity, 'stock not transferred');
  const prec = await pinv.getStockTransfer();
  if (prec === null) {
    return t.ok(false, 'prec was null');
  }

  prec.date = new Date('2022-01-05');
  t.equal(
    ModelNameEnum.PurchaseReceipt,
    prec.schemaName,
    'stock transfer is a PREC'
  );
  t.equal(prec.backReference, pinv.name, 'back reference is set');
  t.equal(prec.items?.[0].quantity, quantity, 'PREC transfers quantity');

  await assertDoesNotThrow(async () => await prec.sync());
  await assertDoesNotThrow(async () => await prec.submit());

  t.equal(prec.name, 'PREC-1002', 'PREC name matches');
  t.equal(pinv.stockNotTransferred, 0, 'stock has been transferred');
  t.equal(pinv.items?.[0].stockNotTransferred, 0, 'stock has been transferred');
});

test('Back Ref Purchase Receipt cancel', async (t) => {
  const prec = (await fyo.doc.getDoc(
    ModelNameEnum.PurchaseReceipt,
    'PREC-1002'
  )) as StockTransfer;

  t.equal(prec.backReference, 'PINV-1001', 'back reference matches');
  await assertDoesNotThrow(async () => {
    await prec.cancel();
  });

  const pinv = (await fyo.doc.getDoc(
    ModelNameEnum.PurchaseInvoice,
    'PINV-1001'
  )) as Invoice;

  t.equal(pinv.stockNotTransferred, 3, 'pinv stock untransferred');
  t.equal(
    pinv.items?.[0].stockNotTransferred,
    3,
    'pinv item stock untransferred'
  );
});

test('Cancel Purchase Invoice after Purchase Receipt is created', async (t) => {
  const pinv = (await fyo.doc.getDoc(
    ModelNameEnum.PurchaseInvoice,
    'PINV-1001'
  )) as Invoice;

  const prec = await pinv.getStockTransfer();
  if (prec === null) {
    return t.ok(false, 'prec was null');
  }

  prec.date = new Date('2022-01-05');
  await prec.sync();
  await prec.submit();

  t.equal(prec.name, 'PREC-1003', 'PREC name matches');
  t.equal(prec.backReference, 'PINV-1001', 'PREC backref matches');

  await assertThrows(async () => {
    await pinv.cancel();
  }, 'cancel prevented cause of PREC');

  const ales = await fyo.db.getAllRaw(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'reverted'],
    filters: { referenceName: pinv.name!, reverted: true },
  });

  t.equal(ales.length, 0);
});

test('Sales Invoice then partial Shipment', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice) as Invoice;

  await sinv.set({
    party,
    date: new Date('2022-01-06'),
    account: 'Debtors',
  });
  await sinv.append('items', { item, quantity: 3, rate });
  await sinv.sync();
  await sinv.submit();

  t.equal(sinv.name, 'SINV-1001', 'SINV name matches');
  t.equal(sinv.stockNotTransferred, 3, 'stock not transferred');

  const shpm = await sinv.getStockTransfer();
  if (shpm === null) {
    return t.ok(false, 'shpm was null');
  }

  shpm.date = new Date('2022-01-07');
  await shpm.items?.[0].set('quantity', 1);

  await assertDoesNotThrow(async () => await shpm.sync());
  await assertDoesNotThrow(async () => await shpm.submit());

  t.equal(ModelNameEnum.Shipment, shpm.schemaName, 'stock transfer is a SHPM');
  t.equal(shpm.backReference, sinv.name, 'back reference is set');
  t.equal(shpm.items?.[0].quantity, 1, 'shpm transfers quantity 1');

  t.equal(shpm.name, 'SHPM-1003', 'SHPM name matches');
  t.equal(sinv.stockNotTransferred, 2, 'stock qty 2 has not been transferred');
  t.equal(
    sinv.items?.[0].stockNotTransferred,
    2,
    'item stock qty 2 has not been transferred'
  );
});

test('Sales Invoice then another Shipment', async (t) => {
  const sinv = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1001'
  )) as Invoice;

  const shpm = await sinv.getStockTransfer();
  if (shpm === null) {
    return t.ok(false, 'shpm was null');
  }

  await assertDoesNotThrow(async () => await shpm.sync());
  await assertDoesNotThrow(async () => await shpm.submit());

  t.equal(shpm.name, 'SHPM-1004', 'SHPM name matches');
  t.equal(shpm.items?.[0].quantity, 2, 'shpm transfers quantity 2');
  t.equal(sinv.stockNotTransferred, 0, 'stock has been transferred');
  t.equal(
    sinv.items?.[0].stockNotTransferred,
    0,
    'item stock has been transferred'
  );
  t.equal(await sinv.getStockTransfer(), null, 'no more stock transfers');
});

test('Cancel Sales Invoice after Shipment is created', async (t) => {
  const sinv = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1001'
  )) as Invoice;
  await assertThrows(
    async () => await sinv.cancel(),
    'cancel prevent cause of SHPM'
  );

  const ales = await fyo.db.getAllRaw(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['name', 'reverted'],
    filters: { referenceName: sinv.name!, reverted: true },
  });

  t.equal(ales.length, 0);
});

test('Cancel partial Shipment', async (t) => {
  let shpm = (await fyo.doc.getDoc(
    ModelNameEnum.Shipment,
    'SHPM-1003'
  )) as StockTransfer;

  t.equal(shpm.backReference, 'SINV-1001', 'SHPM 1 back ref is set');
  t.equal(shpm.items?.[0].quantity, 1, 'SHPM transfers qty 1');

  await assertDoesNotThrow(async () => await shpm.cancel());
  t.ok(shpm.isCancelled, 'SHPM cancelled');

  const sinv = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1001'
  )) as Invoice;
  t.equal(sinv.stockNotTransferred, 1, 'stock qty 1 untransferred');

  shpm = (await fyo.doc.getDoc(
    ModelNameEnum.Shipment,
    'SHPM-1004'
  )) as StockTransfer;

  t.equal(shpm.backReference, 'SINV-1001', 'SHPM 2 back ref is set');
  t.equal(shpm.items?.[0].quantity, 2, 'SHPM transfers qty 2');

  await assertDoesNotThrow(async () => await shpm.cancel());
  t.ok(shpm.isCancelled, 'SHPM cancelled');

  t.equal(sinv.stockNotTransferred, 3, 'all stock untransferred');
});

test('Duplicate Shipment, backref unset', async (t) => {
  const shpm = (await fyo.doc.getDoc(
    ModelNameEnum.Shipment,
    'SHPM-1003'
  )) as StockTransfer;

  t.ok(shpm.backReference, 'SHPM back ref is set');

  const doc = shpm.duplicate();
  t.notOk(doc.backReference, 'Duplicate SHPM back ref is not set');
});

test('Cancel and Delete Sales Invoice with cancelled Shipments', async (t) => {
  const sinv = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1001'
  )) as Invoice;

  await assertDoesNotThrow(async () => await sinv.cancel());
  t.ok(sinv.isCancelled, 'sinv cancelled');

  const transfers = (await fyo.db.getAllRaw(ModelNameEnum.Shipment, {
    fields: ['name'],
    filters: { backReference: 'SINV-1001' },
  })) as { name: string }[];

  await assertDoesNotThrow(async () => await sinv.delete());
  t.notOk(
    await fyo.db.exists(ModelNameEnum.SalesInvoice, 'SINV-1001'),
    'SINV-1001 deleted'
  );

  for (const { name } of transfers) {
    t.notOk(
      await fyo.db.exists(ModelNameEnum.Shipment, 'SINV-1001'),
      `linked Shipment ${name} deleted`
    );
  }
});

test('Create Shipment from manually set Back Ref', async (t) => {
  const rate = (testDocs['Item'][item].rate as number) ?? 0;
  const totalQuantity = 10;
  const prec = await getStockTransfer(
    ModelNameEnum.PurchaseReceipt,
    party,
    new Date('2022-01-08'),
    [
      {
        item,
        location,
        quantity: totalQuantity,
        rate,
      },
    ],
    fyo
  );
  await (await prec.sync()).submit();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice) as Invoice;
  const quantity = 5;
  await sinv.set({
    party,
    date: new Date('2022-01-09'),
    account: 'Debtors',
  });
  await sinv.append('items', { item, quantity, rate });
  await (await sinv.sync()).submit();

  t.equal(sinv.stockNotTransferred, quantity, "stock hasn't been transferred");

  const shpm = fyo.doc.getNewDoc(ModelNameEnum.Shipment) as Shipment;
  await shpm.set('backReference', sinv.name);
  await shpm.set('date', new Date('2022-01-10'));
  shpm.items?.[0].set('location', location);

  t.equal(shpm.party, sinv.party, 'party set');

  await (await shpm.sync()).submit();
  t.equal(
    await fyo.db.getStockQuantity(item, location),
    totalQuantity - quantity,
    'quantity shipped'
  );

  t.equal(sinv.stockNotTransferred, 0, 'stock has been transferred');
});

test('Creating SINV Return if Invoice is not paid', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice) as SalesInvoice;

  await sinv.set({
    party,
    date: new Date('2023-05-18'),
    account: 'Debtors',
    items: [{ item, quantity: 3, rate }],
  });
  await sinv.sync();
  await sinv.submit();

  t.equal(sinv.name, 'SINV-1003', 'SINV name matches');

  const returnSinvDoc = (await sinv.getReturnDoc()) as SalesInvoice;

  await returnSinvDoc.sync();
  await returnSinvDoc.submit();

  t.equal('SINV-1004', returnSinvDoc.name, 'Return Invoice name matches');

  const returnSinvAles = await fyo.db.getAllRaw(
    ModelNameEnum.AccountingLedgerEntry,
    {
      fields: ['name', 'account', 'credit', 'debit'],
      filters: { referenceName: returnSinvDoc.name! },
    }
  );

  for (const ale of returnSinvAles) {
    if (ale.account === 'Sales') {
      t.equal(
        fyo.pesa(ale.credit as string).float,
        fyo.pesa(0).float,
        `Return Invoice *not credited to ${ale.account}`
      );
      t.equal(
        fyo.pesa(ale.debit as string).float,
        fyo.pesa(-300).float,
        `Return Invoice debited from ${ale.account}`
      );
    }

    if (ale.account === 'Debtors') {
      t.equal(
        fyo.pesa(ale.debit as string).float,
        fyo.pesa(0).float,
        `Return Invoice *not debited from ${ale.account}`
      );
      t.equal(
        fyo.pesa(ale.credit as string).float,
        fyo.pesa(-300).float,
        `Return Invoice credited to ${ale.account}`
      );
    }
  }

  const invoiceOutstanding = (await fyo.getValue(
    ModelNameEnum.SalesInvoice,
    sinv.name!,
    'outstandingAmount'
  )) as Money;

  t.true(invoiceOutstanding.isZero(), 'Sales Invoice outstanding is Zero');

  await assertThrows(
    async () => await sinv.cancel(),
    'can not cancel a SINV when a return invoice is created against it'
  );

  await assertDoesNotThrow(
    async () => await returnSinvDoc.cancel(),
    'return invoice cancelled'
  );

  const updatedInvoiceOutstanding = (await fyo.getValue(
    ModelNameEnum.SalesInvoice,
    sinv.name!,
    'outstandingAmount'
  )) as Money;

  t.equal(
    updatedInvoiceOutstanding,
    sinv.outstandingAmount,
    'outstandingAmount updated after return invoice is cancelled'
  );
});

test('Creating PINV Return if Invoice is not paid', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const pinv = fyo.doc.getNewDoc(
    ModelNameEnum.PurchaseInvoice
  ) as PurchaseInvoice;

  await pinv.set({
    party,
    date: new Date('2023-05-18'),
    account: 'Creditors',
    items: [{ item, quantity: 3, rate }],
  });
  await pinv.sync();
  await pinv.submit();

  t.equal(pinv.name, 'PINV-1002', 'PINV name matches');

  const returnPinvDoc = (await pinv.getReturnDoc()) as PurchaseInvoice;

  await returnPinvDoc.sync();
  await returnPinvDoc.submit();

  t.equal('PINV-1003', returnPinvDoc.name, 'Return Invoice name matches');

  const returnPinvAles = await fyo.db.getAllRaw(
    ModelNameEnum.AccountingLedgerEntry,
    {
      fields: ['name', 'account', 'credit', 'debit'],
      filters: { referenceName: returnPinvDoc.name! },
    }
  );

  for (const ale of returnPinvAles) {
    if (ale.account === 'Creditors') {
      t.equal(
        fyo.pesa(ale.credit as string).float,
        fyo.pesa(0).float,
        `Return Invoice *not credited to ${ale.account}`
      );
      t.equal(
        fyo.pesa(ale.debit as string).float,
        fyo.pesa(-300).float,
        `Return Invoice debited from ${ale.account}`
      );
    }

    if (ale.account === 'Stock Received But Not Billed') {
      t.equal(
        fyo.pesa(ale.debit as string).float,
        fyo.pesa(0).float,
        `Return Invoice *not debited from ${ale.account}`
      );
      t.equal(
        fyo.pesa(ale.credit as string).float,
        fyo.pesa(-300).float,
        `Return Invoice credited to ${ale.account}`
      );
    }
  }

  const invoiceOutstanding = (await fyo.getValue(
    ModelNameEnum.PurchaseInvoice,
    pinv.name!,
    'outstandingAmount'
  )) as Money;

  t.true(invoiceOutstanding.isZero(), 'Purchase Invoice outstanding is Zero');

  await assertThrows(
    async () => await pinv.cancel(),
    'can not cancel a PINV when a return invoice is created against it'
  );

  await assertDoesNotThrow(
    async () => await returnPinvDoc.cancel(),
    'return invoice cancelled'
  );

  const updatedInvoiceOutstanding = (await fyo.getValue(
    ModelNameEnum.PurchaseInvoice,
    pinv.name!,
    'outstandingAmount'
  )) as Money;

  t.equal(
    updatedInvoiceOutstanding,
    pinv.outstandingAmount,
    'outstandingAmount updated after return invoice is cancelled'
  );
});

test('Create payments for return PINV', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const pinv = fyo.doc.getNewDoc(
    ModelNameEnum.PurchaseInvoice
  ) as PurchaseInvoice;

  await pinv.set({
    party,
    date: new Date('2023-07-04'),
    account: 'Creditors',
    items: [{ item, quantity: 3, rate }],
  });
  await pinv.sync();
  await pinv.submit();

  t.equal(pinv.name, 'PINV-1004', 'PINV name matches');

  let payment = pinv.getPayment();
  t.equal(payment?.paymentType, PaymentTypeEnum.Pay);

  await payment?.sync();
  await payment?.submit();

  let outstandingAmt = (await fyo.getValue(
    ModelNameEnum.PurchaseInvoice,
    pinv.name!,
    'outstandingAmount'
  )) as Money;

  t.equal(
    outstandingAmt?.float,
    fyo.pesa(0).float,
    'invoice outstanding is zero after payment'
  );

  const returnPinv = await pinv.getReturnDoc();
  await returnPinv?.sync();
  await returnPinv?.submit();

  t.equal(returnPinv?.name, 'PINV-1005', 'Return PINV name matches');

  payment = pinv.getPayment();
  t.equal(payment?.paymentType, PaymentTypeEnum.Receive);

  t.equal(
    payment?.amount?.float,
    pinv.outstandingAmount?.abs().float,
    'payment amount for return invoice matches with original invoice'
  );

  await payment?.sync();
  await payment?.submit();

  outstandingAmt = (await fyo.getValue(
    ModelNameEnum.PurchaseInvoice,
    pinv.name!,
    'outstandingAmount'
  )) as Money;

  t.equal(
    outstandingAmt?.float,
    fyo.pesa(0).float,
    'invoice outstanding is zero after payment for return invoice'
  );
});

test('Create payments for return SINV', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice) as SalesInvoice;

  await sinv.set({
    party,
    date: new Date('2023-07-04'),
    account: 'Debtors',
    items: [{ item, quantity: 3, rate }],
  });
  await sinv.sync();
  await sinv.submit();

  t.equal(sinv.name, 'SINV-1005', 'SINV name matches');

  let payment = sinv.getPayment();
  t.equal(payment?.paymentType, PaymentTypeEnum.Receive);

  await payment?.sync();
  await payment?.submit();

  let outstandingAmt = (await fyo.getValue(
    ModelNameEnum.SalesInvoice,
    sinv.name!,
    'outstandingAmount'
  )) as Money;

  t.equal(
    outstandingAmt?.float,
    fyo.pesa(0).float,
    'invoice outstanding is zero after payment'
  );

  const returnSinv = await sinv.getReturnDoc();
  await returnSinv?.sync();
  await returnSinv?.submit();

  t.equal(returnSinv?.name, 'SINV-1006', 'Return SINV name matches');

  payment = sinv.getPayment();
  t.equal(payment?.paymentType, PaymentTypeEnum.Pay);

  t.equal(
    payment?.amount?.float,
    sinv.outstandingAmount?.abs().float,
    'payment amount for return invoice matches with original invoice'
  );
  await payment?.sync();
  await payment?.submit();

  outstandingAmt = (await fyo.getValue(
    ModelNameEnum.SalesInvoice,
    sinv.name!,
    'outstandingAmount'
  )) as Money;

  t.equal(
    outstandingAmt?.float,
    fyo.pesa(0).float,
    'invoice outstanding is zero after payment for return invoice'
  );
});

closeTestFyo(fyo, __filename);
