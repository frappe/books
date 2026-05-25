import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { VAT_CODES } from 'regional/ee';
import { ClassifiedRow } from './types';

/**
 * Account name used to represent the LHV bank balance in the COA (see
 * fixtures/verified/ee.json). Importer creates one leg against this account
 * and one leg against the classified expense/income account.
 */
const BANK_ACCOUNT = 'Bank - LHV';

/**
 * Reverse-charge VAT account pair (see fixtures/verified/ee.json).
 * Used when proposedVatCode is EU_RC_* or NON_EU_RC: a paired Dr/Cr entry
 * is created so the ledger reflects both the input-VAT and output-VAT legs
 * required for KMD lines 4 + 5 reconciliation.
 */
const RC_PAYABLE = 'Reverse Charge VAT Payable';
const RC_RECEIVABLE = 'Reverse Charge VAT Receivable';

export interface BuildResult {
  /** Number of bank-leg JEs created. */
  bankEntries: number;
  /** Number of reverse-charge paired JEs created. */
  reverseChargeEntries: number;
  /** Archival IDs already present in the DB (skipped to prevent dupes). */
  duplicatesSkipped: string[];
  /** Rows that produced an error during sync. */
  errors: { archivalId: string; message: string }[];
}

/**
 * Persist classified rows as JournalEntry docs.
 *
 * - Each row → one JournalEntry (entryType "Bank Entry"), 2 lines:
 *   if amount > 0: Dr Bank, Cr ProposedAccount
 *   if amount < 0: Dr ProposedAccount, Cr Bank
 * - If VAT code is reverse-charge: also create one paired JournalEntry
 *   (entryType "Journal Entry"): Dr RC_RECEIVABLE, Cr RC_PAYABLE for
 *   abs(amount) × rate / 100. Both legs net to zero on P&L.
 * - Duplicate detection: skip rows whose archivalId already exists.
 *
 * Submits each JE so it hits the ledger.
 */
export async function buildJournalEntries(
  rows: ClassifiedRow[],
  fyo: Fyo
): Promise<BuildResult> {
  const result: BuildResult = {
    bankEntries: 0,
    reverseChargeEntries: 0,
    duplicatesSkipped: [],
    errors: [],
  };

  for (const row of rows) {
    try {
      const existing = (await fyo.db.getAll(ModelNameEnum.JournalEntry, {
        fields: ['name'],
        filters: { lhvArchivalId: row.archivalId },
        limit: 1,
      })) as { name: string }[];

      if (existing.length > 0) {
        result.duplicatesSkipped.push(row.archivalId);
        continue;
      }

      await createBankEntry(row, fyo);
      result.bankEntries += 1;

      if (row.proposedVatCode && isReverseCharge(row.proposedVatCode)) {
        await createReverseChargeEntry(row, fyo);
        result.reverseChargeEntries += 1;
      }
    } catch (err) {
      result.errors.push({
        archivalId: row.archivalId,
        message: (err as Error).message ?? String(err),
      });
    }
  }

  return result;
}

async function createBankEntry(row: ClassifiedRow, fyo: Fyo) {
  const absAmount = Math.abs(row.amount);
  const isInflow = row.amount >= 0;

  const accounts = isInflow
    ? [
        { account: BANK_ACCOUNT, debit: absAmount, credit: 0 },
        { account: row.proposedAccount, debit: 0, credit: absAmount },
      ]
    : [
        { account: row.proposedAccount, debit: absAmount, credit: 0 },
        { account: BANK_ACCOUNT, debit: 0, credit: absAmount },
      ];

  const doc = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
    entryType: 'Bank Entry',
    date: new Date(row.date),
    accounts,
    referenceNumber: row.referenceNumber ?? row.documentNumber,
    userRemark: buildRemark(row),
    lhvArchivalId: row.archivalId,
    lhvVatCode: row.proposedVatCode ?? '',
  });

  await doc.sync();
  await doc.submit();
}

async function createReverseChargeEntry(row: ClassifiedRow, fyo: Fyo) {
  if (!row.proposedVatCode) return;
  const spec = VAT_CODES[row.proposedVatCode];
  if (!spec || !spec.reverseCharge || spec.rate === 0) return;

  const net = Math.abs(row.amount);
  const vatAmount = round2(net * (spec.rate / 100));
  if (vatAmount === 0) return;

  const doc = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
    entryType: 'Journal Entry',
    date: new Date(row.date),
    accounts: [
      { account: RC_RECEIVABLE, debit: vatAmount, credit: 0 },
      { account: RC_PAYABLE, debit: 0, credit: vatAmount },
    ],
    referenceNumber: row.referenceNumber ?? row.documentNumber,
    userRemark: `Reverse charge VAT (${row.proposedVatCode}) for ${row.archivalId}`,
    lhvArchivalId: `${row.archivalId}-RC`,
    lhvVatCode: row.proposedVatCode,
  });

  await doc.sync();
  await doc.submit();
}

function isReverseCharge(code: string): boolean {
  return (
    code === 'EU_RC_GOODS' || code === 'EU_RC_SERVICES' || code === 'NON_EU_RC'
  );
}

function buildRemark(row: ClassifiedRow): string {
  const parts: string[] = [];
  if (row.counterpartyName) parts.push(row.counterpartyName);
  if (row.remittance) parts.push(row.remittance);
  if (row.matchedRuleId) parts.push(`rule:${row.matchedRuleId}`);
  return parts.join(' | ');
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
