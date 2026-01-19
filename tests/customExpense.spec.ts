import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { ModelNameEnum } from '../models/types';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('Expense afterSubmit creates JournalEntry', async (t) => {
  // 1. Setup Accounts
  await fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'Office Supplies',
    rootType: 'Asset',
  }).sync();
  
  await fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'Cash',
    rootType: 'Asset',
  }).sync();

  // 2. Create Expense
  const expense = fyo.doc.getNewDoc('Expense', {
    date: '2026-01-19',
    expense_account: 'Office Supplies',
    payment_account: 'Cash',
    amount: 150,
    description: 'Bought some pens'
  });

  await expense.sync();
  await expense.submit();

  t.ok(expense.name, 'Expense created');

  // 3. Verify Journal Entry
  const entries = await fyo.db.getAll(ModelNameEnum.JournalEntry);
  t.equal(entries.length, 1, 'One journal entry should be created');
  
  const entry = await fyo.doc.getDoc(ModelNameEnum.JournalEntry, entries[0].name);
  t.equal(entry.userRemark, 'Bought some pens');
  
  const accounts = entry.accounts;
  t.equal(accounts.length, 2, 'Journal entry should have 2 accounts');
  
  // Accounts are rows in JournalEntryAccount
  const debitRow = accounts.find((a: any) => a.debit > 0);
  const creditRow = accounts.find((a: any) => a.credit > 0);
  
  t.ok(debitRow, 'Debit row found');
  t.ok(creditRow, 'Credit row found');
  
  t.equal(debitRow.account, 'Office Supplies');
  t.equal(Number(debitRow.debit), 150);
  t.equal(creditRow.account, 'Cash');
  t.equal(Number(creditRow.credit), 150);
});

test('cleanup', async (t) => {
  await closeTestFyo(fyo);
  t.end();
});
