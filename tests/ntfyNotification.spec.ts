import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';
import * as ntfy from '../src/utils/ntfy';
import sinon from 'sinon';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('SalesInvoice afterSubmit sends ntfy notification', async (t) => {
    const sendStub = sinon.stub(ntfy, 'sendNtfyNotification').resolves();

    try {
        // Setup POSSettings
        const posSettings = fyo.singles.POSSettings!;
        await posSettings.set('enableMobileNotifications', true);
        await posSettings.set('messageChannel', 'test-topic');
        await posSettings.set('cashAccount', 'Cash');
        await posSettings.set('defaultAccount', 'Sales');
        await posSettings.sync();

        // Create accounts needed for SalesInvoice
        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Party, {
                name: 'Test Customer',
                partyType: 'Customer',
            }).sync();
        } catch (e) {
            if (!(e instanceof Error) || !e.message?.includes('Duplicate')) throw e;
        }

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Sales',
                rootType: 'Income',
                accountType: 'Income Account',
                parentAccount: 'Indirect Income',
            }).sync();
        } catch (e) {
            if (!(e instanceof Error) || !(e.message?.includes('Duplicate') || e.name === 'DuplicateEntryError')) throw e;
        }

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Debtors',
                rootType: 'Asset',
                accountType: 'Receivable',
                parentAccount: 'Current Assets',
            }).sync();
        } catch (e) {
            if (!(e instanceof Error) || !(e.message?.includes('Duplicate') || e.name === 'DuplicateEntryError')) throw e;
        }

        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                name: 'Cash',
                rootType: 'Asset',
                accountType: 'Cash',
                parentAccount: 'Bank Accounts',
                isGroup: false,
            }).sync();
        } catch (e) {
            if (!(e instanceof Error) || !(e.message?.includes('Duplicate') || e.name === 'DuplicateEntryError')) throw e;
        }

        // Create Item
        try {
            await fyo.doc.getNewDoc(ModelNameEnum.Item, {
                name: 'Test Product',
                itemCode: 'TEST-PROD',
                rate: 100,
            }).sync();
        } catch (e) {
            if (!(e instanceof Error) || !(e.message?.includes('Duplicate') || e.name === 'DuplicateEntryError')) throw e;
        }

        // Create SalesInvoice
        const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
            party: 'Test Customer',
            account: 'Debtors',
            date: '2026-05-07T10:00:00Z',
            isPOS: true,
            items: [
                {
                    item: 'Test Product',
                    quantity: 2,
                    rate: 10000,
                    amount: 20000,
                    account: 'Sales',
                }
            ],
            makeAutoPayment: true,
        });

        await sinv.sync();

        // Manually create the Payment and PaymentFor to simulate what makeAutoPayment does
        // but in a way that getLinkedPayments can find. This is necessary because the test
        // infrastructure may not fully support the automatic payment linking workflow that
        // occurs in production when makeAutoPayment is true. By creating the Payment and
        // PaymentFor documents manually and calling submit(), we ensure getLinkedPayments
        // can find the linked payments without stubbing hasLinkedPayments.
        const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
            party: 'Test Customer',
            date: '2026-05-07T10:00:00Z',
            paymentType: 'Receive',
            account: 'Debtors',
            paymentAccount: 'Cash',
            paymentMethod: 'Cash',
            amount: 20000,
        });
        await payment.sync();
        await payment.submit();

        await fyo.doc.getNewDoc('PaymentFor', {
            parent: payment.name,
            parentSchemaName: ModelNameEnum.Payment,
            parentFieldname: 'for',
            referenceName: sinv.name,
            referenceType: ModelNameEnum.SalesInvoice,
            amount: 20000,
        }).sync();

        await sinv.submit();

        t.ok(sendStub.calledOnce, 'sendNtfyNotification should be called once');
        if (sendStub.calledOnce) {
            const message = sendStub.firstCall.args[1];
            const title = sendStub.firstCall.args[2];
            const tags = sendStub.firstCall.args[3];

            t.equal(title, 'New Sale!', 'Title should be New Sale!');
            t.equal(tags, 'fire', 'Tags should be fire');
            t.ok(message.includes('Following products have just been sold:'), 'Message should include lead-in text');
            t.ok(message.includes('1. Test Product (x2) - 20,000'), 'Message should include formatted product line with thousand separator');
            t.ok(message.includes('Total:** 20,000'), 'Message should include Total with thousand separator');
        }
    } finally {
        sendStub.restore();
    }
});

test('POSClosingShift afterSubmit sends end of day summary via ntfy', async (t) => {
    const sendStub = sinon.stub(ntfy, 'sendNtfyNotification').resolves();

    try {
        // Ensure notifications are enabled
        const posSettings = fyo.singles.POSSettings!;
        await posSettings.set('enableMobileNotifications', true);
        await posSettings.set('messageChannel', 'test-topic');
        await posSettings.sync();

        // Create POSOpeningShift
        const opening = fyo.doc.getNewDoc(ModelNameEnum.POSOpeningShift, {
            openingDate: '2026-05-07T08:00:00Z',
            openingAmounts: [
                { paymentMethod: 'Cash', amount: 1000 }
            ]
        });
        await opening.sync();
        await opening.submit();        // Create a sale for this shift period
        const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
            party: 'Test Customer',
            account: 'Debtors',
            date: '2026-05-07T12:00:00Z',
            isPOS: true,
            items: [
                {
                    item: 'Test Product',
                    quantity: 5,
                    rate: 1000,
                    amount: 5000,
                    account: 'Sales',
                }
            ],
        });
        await sinv.sync();
        await sinv.submit();

        // Create POSClosingShift
        const closing = fyo.doc.getNewDoc(ModelNameEnum.POSClosingShift, {
            openingShift: opening.name,
            closingDate: '2026-05-07T20:00:00Z',
            closingAmounts: [
                {
                    paymentMethod: 'Cash',
                    openingAmount: 1000,
                    expectedAmount: 6000,
                    closingAmount: 6000,
                    differenceAmount: 0
                }
            ]
        });
        await closing.sync();
        await closing.submit();

        const closingCall = sendStub.getCalls().find(c => c.args[2] && (c.args[2] as string).startsWith('EOD Sales Summary'));

        t.ok(closingCall, 'EOD Sales Summary notification should be sent');
        if (closingCall) {
            const message = closingCall.args[1];
            const title = closingCall.args[2];
            t.equal(title, 'EOD Sales Summary - May 7, 2026', 'Title should be EOD Sales Summary - May 7, 2026');
            t.ok(message.includes('Following products were sold today:'), 'Should include lead-in text');
            t.ok(message.includes('Test Product (x'), 'Should include aggregated product details');
            t.ok(message.includes('**Account Balances:**'), 'Should include Account Balances header');
        }
    } finally {
        sendStub.restore();
    }
});

test('cleanup', async (t) => {
    await closeTestFyo(fyo, __filename);
    t.end();
});
