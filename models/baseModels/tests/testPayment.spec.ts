import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { Payment } from '../Payment/Payment';
import { assertDoesNotThrow } from 'backend/database/tests/helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const itemMap = {
  Widget: { name: 'Widget', rate: 100, unit: 'Unit', for: 'Sales' },
  Gadget: { name: 'Gadget', rate: 250, unit: 'Unit', for: 'Sales' },
};

const partyData = {
  name: 'Alice',
  email: 'alice@example.com',
};

test('create items and party for payment tests', async (t) => {
  for (const item of Object.values(itemMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();
    t.ok(
      await fyo.db.exists(ModelNameEnum.Item, item.name),
      `item ${item.name} exists`
    );
  }

  await fyo.doc.getNewDoc(ModelNameEnum.Party, partyData).sync();
  t.ok(
    await fyo.db.exists(ModelNameEnum.Party, partyData.name),
    `party ${partyData.name} exists`
  );
});

test('create and submit two sales invoices', async (t) => {
  // Invoice 1: 2 × Widget @ 100 = 200
  const sinv1 = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    party: partyData.name,
    items: [{ item: 'Widget', rate: 100, quantity: 2 }],
  }) as SalesInvoice;
  await sinv1.sync();
  await sinv1.runFormulas();
  await sinv1.submit();
  t.equal(sinv1.name, 'SINV-1001', 'first invoice created');
  t.equal(sinv1.outstandingAmount?.float, 200, 'SINV-1001 outstanding = 200');

  // Invoice 2: 1 × Gadget @ 250 = 250
  const sinv2 = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    party: partyData.name,
    items: [{ item: 'Gadget', rate: 250, quantity: 1 }],
  }) as SalesInvoice;
  await sinv2.sync();
  await sinv2.runFormulas();
  await sinv2.submit();
  t.equal(sinv2.name, 'SINV-1002', 'second invoice created');
  t.equal(sinv2.outstandingAmount?.float, 250, 'SINV-1002 outstanding = 250');
});

test('payment against multiple invoices should validate total = sum of all outstanding amounts', async (t) => {
  // Create a payment referencing BOTH invoices.
  // Total outstanding across both = 200 + 250 = 450.
  const paymentDoc = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
    party: partyData.name,
    paymentType: 'Receive',
    paymentMethod: 'Cash',
    for: [
      {
        referenceType: ModelNameEnum.SalesInvoice,
        referenceName: 'SINV-1001',
        amount: fyo.pesa(200),
      },
      {
        referenceType: ModelNameEnum.SalesInvoice,
        referenceName: 'SINV-1002',
        amount: fyo.pesa(250),
      },
    ],
  }) as Payment;

  // Setting amount to the correct total (200 + 250 = 450) triggers the
  // `amount` validator. The bug causes totalAmount to be 250 (last invoice
  // only), so the validator rejects 450 > 250 with a ValidationError.
  await assertDoesNotThrow(
    async () => await paymentDoc.set('amount', fyo.pesa(450)),
    'setting amount to 450 against two invoices (200 + 250) should not throw'
  );

  t.equal(
    paymentDoc.amount?.float,
    450,
    'payment amount = 450 (sum of both invoices)'
  );
});

closeTestFyo(fyo, __filename);
