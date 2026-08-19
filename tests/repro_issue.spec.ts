import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';
import { Party } from '../models/baseModels/Party/Party';

import fetch from "node-fetch";
const fyo = getTestFyo();
setupTestFyo(fyo, __filename);
test("Item creation with image should upload to external endpoint", async (t) => {
  const systemSettings = await fyo.doc.getDoc(ModelNameEnum.SystemSettings);
  await systemSettings.setAndSync("imageStorageBucket", "TestBucket");
  const item = fyo.doc.getNewDoc(ModelNameEnum.Item, {
    name: "Test Item with Image",
    image: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  }) as any;
  await item.sync();
  t.ok(item.image.startsWith("https://"), "Item image should be updated to a URL");
  t.end();
});

test("Item update with image should upload to external endpoint", async (t) => {
  const item = await fyo.doc.getDoc(ModelNameEnum.Item, "Test Item with Image") as any;
  await item.setAndSync("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
  t.ok(item.image.startsWith("https://"), "Item image should be updated to a URL on update");
  t.end();
});

test('Party amountSpent and lastPurchaseOn should be populated', async (t) => {
    try {
        const customerName = 'Issue Reproducer Customer';

        // Create Customer
        const customer = fyo.doc.getNewDoc(ModelNameEnum.Party, {
            name: customerName,
            role: 'Customer',
        });
        await customer.sync();

        // Create accounts
        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Sales',
                rootType: 'Income',
                accountType: 'Income Account',
                parentAccount: 'Indirect Income',
            }).sync();
        } catch (e) {}

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Debtors',
                rootType: 'Asset',
                accountType: 'Receivable',
                parentAccount: 'Current Assets',
            }).sync();
        } catch (e) {}

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Item, {
                name: 'Some Item',
                itemCode: 'SOME-ITEM',
                rate: 500,
            }).sync();
        } catch (e) {}

        // Create Sales Invoice
        const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
            party: customerName,
            account: 'Debtors',
            date: '2026-05-10',
            grandTotal: 500,
            items: [
              {
                item: 'Some Item',
                quantity: 1,
                rate: 500,
                amount: 500,
                account: 'Sales'
              }
            ]
        });
        await sinv.sync();
        await sinv.submit();

        // Refetch customer and run formulas
        const fetchedCustomer = await fyo.doc.getDoc(ModelNameEnum.Party, customerName) as Party;
        await fetchedCustomer.runFormulas();
        
        t.ok(fetchedCustomer.amountSpent, 'amountSpent should not be nil');
        t.equal(fetchedCustomer.amountSpent, 500, 'amountSpent should be 500');
        t.ok(fetchedCustomer.lastPurchaseOn, 'lastPurchaseOn should not be nil');
        t.equal(fetchedCustomer.lastPurchaseOn, '2026-05-10', 'lastPurchaseOn should be 2026-05-10');

    } catch (e) {
        t.fail(e instanceof Error ? e.message : String(e));
    } finally {
        t.end();
        await closeTestFyo(fyo, __filename);
    }
});

closeTestFyo(fyo, __filename);