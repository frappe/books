import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { Party } from '../Party/Party';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('Party list view settings should be updated', async (t) => {
  const settings = Party.getListViewSettings();
  t.notOk(settings.columns!.includes('email'), 'email column should be removed');
  t.ok(settings.columns!.includes('lastPurchaseOn'), 'lastPurchaseOn column should be added');
  t.ok(settings.columns!.includes('amountSpent'), 'amountSpent column should be added');
});

test('Party should calculate amountSpent and lastPurchaseOn', async (t) => {
  const partyName = 'Test Customer';
  const partyDoc = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: partyName,
    role: 'Customer',
  }) as Party;
  await partyDoc.sync();

  // Initially they should be 0/undefined
  // We need to wait for implementation to know the exact field names and types
  // But we can test the logic once implemented.
  
  const sinv1 = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    party: partyName,
    account: 'Debtors',
    date: '2026-01-01',
    items: [{ item: 'Test Item', quantity: 1, rate: 100 }]
  }) as SalesInvoice;
  await sinv1.sync();
  await sinv1.submit();

  const sinv2 = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    party: partyName,
    account: 'Debtors',
    date: '2026-02-01',
    items: [{ item: 'Test Item', quantity: 1, rate: 200 }]
  }) as SalesInvoice;
  await sinv2.sync();
  await sinv2.submit();

  // Reload party doc to see if virtual fields are populated
  const loadedParty = await fyo.doc.getDoc(ModelNameEnum.Party, partyName) as any;
  
  // These will fail until implemented
  t.equal(loadedParty.amountSpent?.toNumber(), 300, 'amountSpent should be 300');
  t.equal(loadedParty.lastPurchaseOn, '2026-02-01', 'lastPurchaseOn should be 2026-02-01');
});
