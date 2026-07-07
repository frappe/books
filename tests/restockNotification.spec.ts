import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';
import * as ntfy from '../src/utils/ntfy';
import sinon from 'sinon';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('SalesInvoice low stock notification', async (t) => {
    const sendStub = sinon.stub(ntfy, 'sendNtfyNotification').resolves();

    try {
        // Setup POSSettings
        const posSettings = fyo.singles.POSSettings!;
        await posSettings.set('enableMobileNotifications', true);
        await posSettings.set('messageChannel', 'test-restock');
        await posSettings.set('cashAccount', 'Debtors'); // Just to satisfy mandatory
        await posSettings.set('defaultAccount', 'Sales'); // Just to satisfy mandatory
        await posSettings.sync();

        // Create accounts
        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Sales',
                rootType: 'Income',
                parentAccount: 'Indirect Income'
            }).sync();
        } catch (e: any) {
        }
        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Debtors',
                rootType: 'Asset',
                parentAccount: 'Current Assets'
            }).sync();
        } catch (e: any) {
        }

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Location, {
                name: 'Main'
            }).sync();
        } catch (e: any) {
        }

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Party, {
                name: 'Test Customer',
                partyType: 'Customer'
            }).sync();
        } catch (e: any) {
        }
        // Create Items with restockQuantity
        // Item 1: Light bulb, restock at 25, current 30, sell 10 -> balance 20 (Trigger)
        const item1 = fyo.doc.getNewDoc(ModelNameEnum.Item, {
            name: 'Light bulb',
            rate: 100,
            trackItem: true,
            restockQuantity: 25,
            incomeAccount: 'Sales',
            expenseAccount: 'Sales'
        });
        await item1.sync();

        // Item 2: Circuit Breaker, restock at 5, current 10, sell 8 -> balance 2 (Trigger)
        const item2 = fyo.doc.getNewDoc(ModelNameEnum.Item, {
            name: 'Circuit Breaker',
            rate: 500,
            trackItem: true,
            restockQuantity: 5,
            incomeAccount: 'Sales',
            expenseAccount: 'Sales'
        });
        await item2.sync();

        // Item 3: Switch, restock at 2, current 10, sell 1 -> balance 9 (No Trigger)
        const item3 = fyo.doc.getNewDoc(ModelNameEnum.Item, {
            name: 'Switch',
            rate: 50,
            trackItem: true,
            restockQuantity: 2,
            incomeAccount: 'Sales',
            expenseAccount: 'Sales'
        });
        await item3.sync();

        // Add initial stock via Stock Ledger Entries (manually for speed in test)
        const addStock = async (itemName: string, qty: number) => {
            const sle = fyo.doc.getNewDoc(ModelNameEnum.StockLedgerEntry, {
                item: itemName,
                quantity: qty,
                rate: 10,
                date: new Date().toISOString(),
                location: 'Main'
            });
            await sle.sync();
            await sle.submit();
        };

        await addStock('Light bulb', 30);
        await addStock('Circuit Breaker', 10);
        await addStock('Switch', 10);

        // Create SalesInvoice
        const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
            party: 'Test Customer',
            account: 'Debtors',
            date: new Date().toISOString(),
            isPOS: true,
            items: [
                { item: 'Light bulb', quantity: 10, rate: 100, amount: 1000, account: 'Sales' },
                { item: 'Circuit Breaker', quantity: 9, rate: 500, amount: 4500, account: 'Sales' },
                { item: 'Switch', quantity: 1, rate: 50, amount: 50, account: 'Sales' }
            ],
            submitted: 0,
            makeAutoStockTransfer: true // ENSURE STOCK IS MOVED
        });

        await sinv.sync();
        // Use SalesInvoice submit logic which includes Stock Transfer
        await sinv.submit();

        // We expect TWO notifications: 
        // 1. The original "New Sale!" notification (from existing code)
        // 2. The new "Inventory Restock Required" notification

        const restockCall = sendStub.getCalls().find(call => call.args[2] === 'Inventory Restock Required');

        t.ok(restockCall, 'Restock notification should be sent');

        if (restockCall) {
            const [fyoArg, message, title, tags, priority] = restockCall.args;

            t.equal(title, 'Inventory Restock Required', 'Title should match');
            t.equal(tags, 'rotating_light', 'Tags should be rotating_light');
            t.equal(priority, 'high', 'Priority should be high');

            // Items in test:
            // Light bulb: 30 initial - 10 sale = 20 balance. Restock 25. Triggered.
            // Circuit Breaker: 10 initial - 9 sale = 1 balance. Restock 5. Triggered.
            // Switch: 10 initial - 1 sale = 9 balance. Restock 2. Not triggered.

            t.ok(message.includes('Light bulb - 20 remaining'), 'Message should include Light bulb');
            t.ok(message.includes('Circuit Breaker - 1 remaining'), 'Message should include Circuit Breaker');
            t.notOk(message.includes('Switch'), 'Message should NOT include Switch');
            t.ok(message.includes('Please refill your inventory'), 'Message should include footer');
        }

    } finally {
        sendStub.restore();
    }
});

test('cleanup', async (t) => {
    await closeTestFyo(fyo, __filename);
    t.end();
});
