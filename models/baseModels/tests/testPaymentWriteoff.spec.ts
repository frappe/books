import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { PurchaseInvoice } from '../PurchaseInvoice/PurchaseInvoice';
import { Payment } from '../Payment/Payment';

/**
 * Regression tests for #1540 — write-off (discount) on a payment was posted to
 * the wrong accounts.
 *
 * For a Receive payment of an invoice worth 157.5 with a 2.5 write-off, the
 * expected ledger is:
 *   Cash      Dr 155.0   (amountPaid = amount - writeoff)
 *   Write Off Dr   2.5
 *        To Debtors Cr 157.5
 *
 * Before the fix, Cash was debited the full 157.5 and the write-off leg touched
 * Debtors again with an inverted sign, leaving Cash overstated and Write Off on
 * the wrong side.
 */

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const writeOffAccount = 'Write Off';
const partyName = 'Test Party';
const itemName = 'Test Item';
const rate = 157.5;
const writeoffAmount = 2.5;

interface Ale {
  account: string;
  debit: number;
  credit: number;
}

async function alesForReference(referenceName: string): Promise<Ale[]> {
  const rows = (await fyo.db.getAllRaw(ModelNameEnum.AccountingLedgerEntry, {
    fields: ['account', 'debit', 'credit'],
    filters: { referenceName },
  })) as { account: string; debit: string; credit: string }[];

  return rows.map((r) => ({
    account: r.account,
    debit: fyo.pesa(r.debit ?? 0).float,
    credit: fyo.pesa(r.credit ?? 0).float,
  }));
}

function net(ales: Ale[], account: string): { debit: number; credit: number } {
  const debit = ales
    .filter((a) => a.account === account)
    .reduce((s, a) => s + a.debit, 0);
  const credit = ales
    .filter((a) => a.account === account)
    .reduce((s, a) => s + a.credit, 0);
  return { debit, credit };
}

test('#1540 setup: party, item, write-off account', async (t) => {
  await fyo.singles.AccountingSettings!.setAndSync(
    'writeOffAccount',
    writeOffAccount
  );
  t.equal(
    fyo.singles.AccountingSettings!.writeOffAccount,
    writeOffAccount,
    'write-off account is configured'
  );

  await fyo.doc
    .getNewDoc(ModelNameEnum.Party, {
      name: partyName,
      role: 'Both',
    })
    .sync();

  await fyo.doc
    .getNewDoc(ModelNameEnum.Item, {
      name: itemName,
      rate,
      for: 'Both',
    })
    .sync();

  t.ok(await fyo.db.exists(ModelNameEnum.Party, partyName), 'party exists');
  t.ok(await fyo.db.exists(ModelNameEnum.Item, itemName), 'item exists');
});

test('#1540 Receive: write-off posts Cash=amountPaid, WriteOff Dr, Debtors clears full amount', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    party: partyName,
    items: [{ item: itemName, rate, quantity: 1 }],
  }) as SalesInvoice;

  await sinv.runFormulas();
  await sinv.sync();
  await sinv.submit();

  const payment = sinv.getPayment() as Payment;
  await payment.set('writeoff', fyo.pesa(writeoffAmount));
  await payment.set('paymentAccount', 'Cash');
  await payment.runFormulas();
  await payment.sync();
  await payment.submit();

  t.equal(
    (payment.amount as ReturnType<typeof fyo.pesa>).float,
    rate,
    'payment amount is the full invoice amount (157.5)'
  );
  t.equal(
    (payment.amountPaid as ReturnType<typeof fyo.pesa>).float,
    rate - writeoffAmount,
    'amountPaid is amount - writeoff (155)'
  );

  const ales = await alesForReference(payment.name!);
  const cash = net(ales, 'Cash');
  const debtors = net(ales, 'Debtors');
  const wo = net(ales, writeOffAccount);

  t.equal(cash.debit, 155, 'Cash is debited amountPaid (155), not the full amount');
  t.equal(cash.credit, 0, 'Cash is not credited');
  t.equal(debtors.credit - debtors.debit, 157.5, 'Debtors clears the full amount (157.5)');
  t.equal(wo.debit, 2.5, 'Write Off is debited the write-off amount (2.5)');
  t.equal(wo.credit, 0, 'Write Off is not credited on a Receive');
});

test('#1540 Purchase payment with write-off: cash moves amountPaid, party clears full amount, ledger balances', async (t) => {
  const pinv = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
    account: 'Creditors',
    party: partyName,
    items: [{ item: itemName, rate, quantity: 1 }],
  }) as PurchaseInvoice;

  await pinv.runFormulas();
  await pinv.sync();
  await pinv.submit();

  const payment = pinv.getPayment() as Payment;
  // getPayment() puts the party account (Creditors) in `paymentAccount`; the
  // cash/bank account goes in `account`.
  await payment.set('writeoff', fyo.pesa(writeoffAmount));
  await payment.set('account', 'Cash');
  await payment.runFormulas();
  await payment.sync();
  await payment.submit();

  const ales = await alesForReference(payment.name!);
  const cash = net(ales, 'Cash');
  const creditors = net(ales, 'Creditors');
  const wo = net(ales, writeOffAccount);

  // The party account (Creditors) must clear the full invoice amount (157.5),
  // cash moves only amountPaid (155), and the write-off account absorbs the 2.5.
  t.equal(
    Math.abs(creditors.debit - creditors.credit),
    157.5,
    'Creditors clears the full amount (157.5), not the reduced amountPaid'
  );
  t.equal(
    Math.abs(cash.debit - cash.credit),
    155,
    'Cash moves only amountPaid (155), not the full amount'
  );
  t.equal(
    wo.debit + wo.credit,
    2.5,
    'Write Off account absorbs the write-off amount (2.5)'
  );

  // Double-entry integrity: total debits equal total credits.
  const totalDebit = ales.reduce((s, a) => s + a.debit, 0);
  const totalCredit = ales.reduce((s, a) => s + a.credit, 0);
  t.equal(totalDebit, totalCredit, 'ledger balances (total debit == total credit)');
  t.equal(totalDebit, 157.5, 'total posted is the full invoice amount');
});

closeTestFyo(fyo, __filename);
