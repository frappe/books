import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';
import * as ntfy from '../src/utils/ntfy';
import sinon from 'sinon';
import { SalesInvoice } from '../models/baseModels/SalesInvoice/SalesInvoice';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('SalesInvoice notification shows Payment Method Receiving Account', async (t) => {
    const sendStub = sinon.stub(ntfy, 'sendNtfyNotification').resolves();
    try {
            const accountName = 'M-Pesa Account';
            const paymentMethodName = 'M-Pesa';

            // 0. Setup Accounts
            const accounts = [
                { name: accountName, rootType: 'Asset', accountType: 'Cash', parentAccount: 'Bank Accounts' },
                { name: 'Debtors', rootType: 'Asset', accountType: 'Receivable', parentAccount: 'Current Assets' },
                { name: 'Sales', rootType: 'Income', accountType: 'Income Account', parentAccount: 'Indirect Income' }
            ];

            for (const acc of accounts) {
                try {
                    await fyo.doc.getNewDoc(ModelNameEnum.Account, {
                        ...acc,
                        company: 'Test Company'
                    }).sync();
                } catch (e) {}
            }

            // 1. Enable notifications and set required fields
            const posSettings = fyo.singles.POSSettings!;
            await posSettings.set('cashAccount', accountName);
            await posSettings.set('defaultAccount', 'Debtors');
            await posSettings.set('enableMobileNotifications', true);
            await posSettings.set('messageChannel', 'test-topic');
            await posSettings.sync();

            try {
                await fyo.doc.getNewDoc(ModelNameEnum.PaymentMethod, {
                    name: paymentMethodName,
                    type: 'Cash',
                    account: accountName
                }).sync();
            } catch (e) {}

            try {
                await fyo.doc.getNewDoc(ModelNameEnum.Party, {
                    name: 'Test Customer',
                    partyType: 'Customer',
                }).sync();
            } catch (e) {}

            try {
                await fyo.doc.getNewDoc(ModelNameEnum.Item, {
                    name: 'Test Product',
                    itemCode: 'TEST-PROD',
                    rate: 5000,
                }).sync();
            } catch (e) {}

            // 3. Create Sales Invoice
            const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
                party: 'Test Customer',
                account: 'Debtors',
                date: '2026-05-12T10:00:00Z',
                isPOS: true,
                grandTotal: 5000,
                hasLinkedPayments: true, // IMPORTANT: Enable this for getLinkedPayments to work
                items: [
                    {
                        item: 'Test Product',
                        quantity: 1,
                        rate: 5000,
                        amount: 5000,
                        account: 'Sales',
                    }
                ],
            }) as SalesInvoice;
            await sinv.sync();

            // 4. Create Linked Payment
            const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
                party: 'Test Customer',
                date: '2026-05-12T10:00:05Z',
                paymentType: 'Receive',
                account: 'Debtors',
                paymentAccount: accountName,
                paymentMethod: paymentMethodName,
                amount: 5000,
            });
            await payment.sync();
            await payment.submit();

            await fyo.doc.getNewDoc('PaymentFor', {
                parent: payment.name,
                parentSchemaName: ModelNameEnum.Payment,
                parentFieldname: 'for',
                referenceName: sinv.name,
                referenceType: ModelNameEnum.SalesInvoice,
                amount: 5000,
            }).sync();

            console.log('DEBUG TEST: Checking PaymentFor for', sinv.name);
            const paymentFors = await fyo.db.getAllRaw('PaymentFor', {
                filters: { referenceName: sinv.name as string, referenceType: ModelNameEnum.SalesInvoice as string }
            });
            console.log('DEBUG TEST: Found PaymentFors:', paymentFors.length, paymentFors);

            // 5. Submit Sales Invoice
            await sinv.submit();

            // 6. Verify Notification Message
            t.ok(sendStub.calledOnce, 'Notification should be sent');
            if (sendStub.calledOnce) {
                const message = sendStub.firstCall.args[1];
                console.log('Notification Message:', message);
                t.ok(message.includes('Receiving Account: M-Pesa Account'), 'Message should include the receiving account');
            }
        } finally {
            sendStub.restore();
        }
    });

    test('cleanup', async (t) => {
          await closeTestFyo(fyo, __filename);
          t.end();
      });
