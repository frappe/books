import { Fyo } from 'fyo';
import { BankTransaction } from './bankStatementParsers';

export async function importBankTransactions(
  fyo: Fyo,
  transactions: BankTransaction[],
  bankAccount: string,
  suspenseAccount: string
) {
  const schemaName = 'AccountingLedgerEntry';
  let importCount = 0;

  for (const tx of transactions) {
    if (tx.amount === 0) continue;
    if (!tx.date) continue;

    let debitAccount = '';
    let creditAccount = '';
    let finalAmount = 0;

    // Double Entry Logic
    if (tx.amount > 0) {
      // Deposit: Bank Debited (Increase), Suspense Credited
      debitAccount = bankAccount;
      creditAccount = suspenseAccount;
      finalAmount = tx.amount;
    } else {
      // Withdrawal: Bank Credited (Decrease), Suspense Debited
      debitAccount = suspenseAccount;
      creditAccount = bankAccount;
      finalAmount = Math.abs(tx.amount);
    }

    const commonData = {
        date: tx.date,
        voucherType: 'Bank Import',
        remark: tx.description.substring(0, 280),
    };

    // Entry 1 (Debit Side)
    const doc1 = fyo.doc.getNewDoc(schemaName, {
        ...commonData,
        account: debitAccount,
        debit: finalAmount,
        credit: 0
    }, false);

    // Entry 2 (Credit Side)
    const doc2 = fyo.doc.getNewDoc(schemaName, {
        ...commonData,
        account: creditAccount,
        debit: 0,
        credit: finalAmount
    }, false);

    try {
        await fyo.db.set(schemaName, doc1);
        await fyo.db.set(schemaName, doc2);
        importCount++;
    } catch (error) {
        console.error("Importer: Failed to save transaction", tx, error);
    }
  }

  return importCount;
}