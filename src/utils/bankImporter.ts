import { Fyo } from 'fyo';
import { BankTransaction } from './bankStatementParsers';

export async function importBankTransactions(
  fyo: Fyo,
  transactions: BankTransaction[],
  bankAccount: string,
  suspenseAccount: string
) {
  const schemaName = 'JournalEntry';
  let importCount = 0;
  let lastError: any = null;

  // Pre-check: Ensure we can create a doc
  try {
    const tempDoc = fyo.doc.getNewDoc(schemaName, {});
    if (!tempDoc) {
      console.warn(
        'Importer: Failed to initialize a temporary JournalEntry doc.'
      );
    }
  } catch (e) {
    console.warn('Importer: Pre-check failed', e);
  }

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

    // Create a single Journal Entry document
    const doc = fyo.doc.getNewDoc(schemaName, {
      date: tx.date,
      entryType: 'Bank Entry',
      userRemark: tx.description
        ? tx.description.substring(0, 280)
        : 'Bank Import',
      accounts: [
        {
          account: debitAccount,
          debit: finalAmount,
          credit: 0,
          description: tx.description,
        },
        {
          account: creditAccount,
          debit: 0,
          credit: finalAmount,
          description: tx.description,
        },
      ],
    });

    try {
      // Saves as Draft. To submit immediately, call await doc.submit() after sync.
      await doc.sync();
      importCount++;
    } catch (error) {
      console.error('Importer: Failed to save transaction', tx, error);
      lastError = error;
      // Stop at the first error to allow debugging
      break;
    }
  }

  if (importCount === 0 && transactions.length > 0 && lastError) {
    throw lastError;
  }

  return importCount;
}
