import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { Payment } from '../Payment/Payment';
import { PaymentTypeEnum } from '../Payment/types';
import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';
import { PurchaseInvoice } from '../PurchaseInvoice/PurchaseInvoice';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const itemData = {
  name: 'Pen',
  rate: 100,
  unit: 'Unit',
  for: 'Both',
  trackItem: true,
  hasBatch: true,
  hasSerialNumber: true,
};

const partyData = {
  name: 'John Whoe',
  email: 'john@whoe.com',
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
};

test('create test docs', async (t) => {
  await fyo.doc.getNewDoc(ModelNameEnum.Item, itemData).sync();

  t.ok(
    fyo.db.exists(ModelNameEnum.Item, itemData.name),
    `dummy item ${itemData.name}  exists`
  );

  await fyo.doc.getNewDoc(ModelNameEnum.Party, partyData).sync();
  t.ok(
    fyo.db.exists(ModelNameEnum.Party, partyData.name),
    `dummy party ${partyData.name} exists`
  );

  for (const batch of Object.values(batchMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Batch, batch).sync(),
      t.ok(
        fyo.db.exists(ModelNameEnum.Batch, batch.name),
        `batch ${batch.name} exists`
      );
  }
});

test('create SINV with batch then create payment against it', async (t) => {
  const sinvDoc = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    party: partyData.name,
    items: [
      {
        item: itemData.name,
        batch: batchMap.batchOne.name,
        rate: itemData.rate,
        quantity: 2,
      },
    ],
  }) as SalesInvoice;

  await sinvDoc.sync();
  await sinvDoc.runFormulas();
  await sinvDoc.submit();

  t.ok(
    fyo.db.exists(ModelNameEnum.SalesInvoice, sinvDoc.name),
    `${sinvDoc.name} exists`
  );

  const paymentDoc = sinvDoc.getPayment();
  await paymentDoc?.sync();
  await paymentDoc?.submit();

  t.equals(paymentDoc?.name, 'PAY-1001');
});

test('create SINV return for one qty', async (t) => {
  const sinvDoc = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1001'
  )) as SalesInvoice;

  let returnDoc = (await sinvDoc?.getReturnDoc()) as SalesInvoice;

  returnDoc.items = [];
  returnDoc.append('items', {
    item: itemData.name,
    batch: batchMap.batchOne.name,
    quantity: 1,
    rate: itemData.rate,
  });

  await returnDoc.runFormulas();
  await returnDoc.sync();
  await returnDoc.submit();

  t.ok(
    await fyo.db.exists(ModelNameEnum.SalesInvoice, returnDoc.name),
    'SINV return for one qty created'
  );

  t.equals(
    returnDoc.outstandingAmount?.float,
    itemData.rate,
    'returnDoc outstanding amount matches'
  );

  const returnSinvAles = await fyo.db.getAllRaw(
    ModelNameEnum.AccountingLedgerEntry,
    {
      fields: ['name', 'account', 'credit', 'debit'],
      filters: { referenceName: returnDoc.name! },
    }
  );

  for (const ale of returnSinvAles) {
    if (ale.account === 'Sales') {
      t.equal(
        fyo.pesa(ale.debit as string).float,
        fyo.pesa(itemData.rate).float,
        `return Invoice debited from ${ale.account}`
      );
    }

    if (ale.account === 'Debtors') {
      t.equal(
        fyo.pesa(ale.credit as string).float,
        fyo.pesa(itemData.rate).float,
        `return Invoice credited to ${ale.account}`
      );
    }
  }

  await assertThrows(
    async () => await sinvDoc.cancel(),
    'can not cancel a SINV when a return invoice is created against it'
  );
});

test('create SINV return for balance qty', async (t) => {
  const sinvDoc = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1001'
  )) as SalesInvoice;

  const returnDoc = (await sinvDoc?.getReturnDoc()) as SalesInvoice;
  t.equals(
    Object.values(returnDoc.items!)[0].quantity,
    -1,
    'return doc has 1 qty left to return'
  );

  await returnDoc.sync();

  await returnDoc.runFormulas();
  await returnDoc.submit();

  t.ok(
    await fyo.db.exists(ModelNameEnum.SalesInvoice, returnDoc.name),
    'SINV return for one qty created'
  );

  t.equals(
    returnDoc.outstandingAmount?.float,
    itemData.rate,
    'return doc outstanding amount matches'
  );
});

test('create payment for return invoice', async (t) => {
  const returnDoc = (await fyo.doc.getDoc(
    ModelNameEnum.SalesInvoice,
    'SINV-1002'
  )) as SalesInvoice;

  t.equals(returnDoc.returnAgainst, 'SINV-1001');

  const paymentDoc = returnDoc.getPayment() as Payment;
  t.equals(paymentDoc.paymentType, PaymentTypeEnum.Pay, 'payment type is pay');

  t.equals(
    paymentDoc.amount?.float,
    itemData.rate,
    'payment amount for return invoice matches'
  );

  await paymentDoc.sync();

  t.ok(
    await fyo.db.exists(ModelNameEnum.Payment, paymentDoc.name),
    'payment entry created for return invoice'
  );

  await assertDoesNotThrow(
    async () => await returnDoc.cancel(),
    'return invoice cancelled'
  );
});

test('creating PINV return when invoice is not paid', async (t) => {
  const pinvDoc = fyo.doc.getNewDoc(
    ModelNameEnum.PurchaseInvoice
  ) as PurchaseInvoice;

  await pinvDoc.set({
    party: partyData.name,
    account: 'Creditors',
    items: [
      {
        item: itemData.name,
        batch: batchMap.batchOne.name,
        quantity: 2,
        rate: itemData.rate,
      },
    ],
  });
  await pinvDoc.sync();
  await pinvDoc.submit();

  t.equals(pinvDoc.name, 'PINV-1001', `${pinvDoc.name} is submitted`);

  const returnDoc = (await pinvDoc.getReturnDoc()) as PurchaseInvoice;
  await returnDoc.sync();
  await returnDoc.submit();

  t.equals(
    returnDoc?.returnAgainst,
    pinvDoc.name,
    `return pinv created against ${pinvDoc.name}`
  );
  t.equals(
    Object.values(returnDoc.items!)[0].quantity,
    -2,
    'pinv returned qty matches'
  );

  const returnSinvAles = await fyo.db.getAllRaw(
    ModelNameEnum.AccountingLedgerEntry,
    {
      fields: ['name', 'account', 'credit', 'debit'],
      filters: { referenceName: returnDoc.name! },
    }
  );

  for (const ale of returnSinvAles) {
    if (ale.account === 'Creditors') {
      t.equal(
        0,
        returnDoc.outstandingAmount!.float,
        `return Invoice debited from ${ale.account}`
      );
    }

    if (ale.account === 'Cost of Goods Sold') {
      t.equal(
        fyo.pesa(ale.credit as string).float,
        returnDoc.outstandingAmount!.float,
        `return Invoice credited to ${ale.account}`
      );
    }
  }
});

closeTestFyo(fyo, __filename);
