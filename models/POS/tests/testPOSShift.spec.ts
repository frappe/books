import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { getItem } from 'models/inventory/tests/helpers';
import { ModelNameEnum } from 'models/types';
import { RawValue } from 'schemas/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { POSShift } from '../POSShift';
import { Money } from 'pesa';
import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

const item = 'Pen';
const party = 'Someone';
const testDocs = {
  Item: {
    [item]: getItem(item, 100),
  },
  Party: { [party]: { name: party, Role: 'Both' } },
} as Record<string, Record<string, { name: string; [key: string]: RawValue }>>;

test('test POS Shift Opening & Closing', async () => {
  const posShiftDoc = (await fyo.doc.getDoc(
    ModelNameEnum.POSShift
  )) as POSShift;

  await assertThrows(
    () => posShiftDoc.closeShift(),
    'can not close POS Shift as Shift is not opened'
  );

  await posShiftDoc.setAndSync({ openingAmount: fyo.pesa(-1) });
  await assertThrows(
    () => posShiftDoc.openShift(),
    'can not open POS Shift with negative opening amount'
  );

  await posShiftDoc.setAndSync({ openingAmount: fyo.pesa(1) });
  await assertDoesNotThrow(() => posShiftDoc.openShift(), 'POS Shift opened');

  await assertDoesNotThrow(() => posShiftDoc.closeShift());
});

test('open POS Shift, create transaction then close POS Shift', async (t) => {
  const rate = testDocs.Item[item].rate as number;
  const date = new Date(1689273000117).toISOString();
  const posShiftDoc = (await fyo.doc.getDoc(
    ModelNameEnum.POSShift
  )) as POSShift;

  for (const schemaName in testDocs) {
    for (const name in testDocs[schemaName]) {
      await fyo.doc.getNewDoc(schemaName, testDocs[schemaName][name]).sync();
    }
  }

  t.true(await posShiftDoc.openShift(), 'POS Shift opened');

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice) as Invoice;
  await sinv.set({
    party,
    date,
    account: 'Debtors',
  });

  await sinv.append('items', { item, quantity: 3, rate, account: 'Debtors' });
  await sinv.sync();
  await sinv.submit();

  t.equal(sinv.name, 'SINV-1001', 'sales invoice created');

  const totals = (await fyo.db.getPOSShiftTotalSales(
    date,
    new Date().toISOString()
  )) as { totalAfterTax: Money; totalBeforeTax: Money };

  t.equal(sinv.grandTotal?.float, totals.totalAfterTax.float);
  t.true(await posShiftDoc.closeShift(), 'POS Shift closed');
});

closeTestFyo(fyo, __filename);
