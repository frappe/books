import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const itemData = {
  name: 'Widget',
  rate: 100,
  unit: 'Unit',
  for: 'Both',
};

const partyData = {
  name: 'Test Party',
  email: 'test@example.com',
};

test('create test docs for discount tests', async (t) => {
  await fyo.doc.getNewDoc(ModelNameEnum.Item, itemData).sync();
  t.ok(
    await fyo.db.exists(ModelNameEnum.Item, itemData.name),
    `item ${itemData.name} exists`
  );

  await fyo.doc.getNewDoc(ModelNameEnum.Party, partyData).sync();
  t.ok(
    await fyo.db.exists(ModelNameEnum.Party, partyData.name),
    `party ${partyData.name} exists`
  );

  // Enable discounting in AccountingSettings
  await fyo.singles.AccountingSettings?.set('enableDiscounting', true);
  t.ok(
    fyo.singles.AccountingSettings?.enableDiscounting,
    'discounting is enabled'
  );
});

test('discount amount subtracts from line total, not per-unit rate', async (t) => {
  /**
   * Bug: getDiscountedTotalBeforeTaxation() computes
   *   (Rate - DiscountAmount) * Quantity  = (100 - 50) * 3 = 150
   *
   * Correct behaviour (per the comment in InvoiceItem.ts):
   *   Quantity * Rate - DiscountAmount     = 3 * 100 - 50  = 250
   *
   * The two formulas only differ when quantity > 1.
   */
  const rate = 100;
  const quantity = 3;
  const discountAmount = 50;
  const expectedDiscountedTotal = rate * quantity - discountAmount; // 250

  const sinvDoc = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    party: partyData.name,
    items: [
      {
        item: itemData.name,
        rate,
        quantity,
      },
    ],
  }) as SalesInvoice;

  // Set discount fields via .set() to trigger formula chain (like the UI does)
  const item = sinvDoc.items?.[0];
  t.ok(item, 'invoice has an item row');

  await item!.set('setItemDiscountAmount', true);
  await item!.set('itemDiscountAmount', fyo.pesa(discountAmount));
  await sinvDoc.runFormulas();

  t.equal(
    item?.itemDiscountedTotal?.float,
    expectedDiscountedTotal,
    `itemDiscountedTotal should be ${expectedDiscountedTotal} ` +
      `(Qty×Rate - Discount = ${quantity}×${rate} - ${discountAmount}), ` +
      `not ${(rate - discountAmount) * quantity} ` +
      `((Rate - Discount)×Qty)`
  );
});

closeTestFyo(fyo, __filename);
