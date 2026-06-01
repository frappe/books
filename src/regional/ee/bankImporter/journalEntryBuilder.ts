import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { VAT_CODES } from 'regional/ee';
import { ClassifiedRow } from './types';

const RC_PAYABLE = '2314 - RC VAT Payable';
const RC_RECEIVABLE = '2314 - RC VAT Receivable';

export interface BuildResult {
  bankEntries: number;
  reverseChargeEntries: number;
  duplicatesSkipped: string[];
  errors: { archivalId: string; message: string }[];
}

export async function buildJournalEntries(
  rows: ClassifiedRow[],
  fyo: Fyo,
  bankAccount: string
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

      await createBankEntry(row, fyo, bankAccount);
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

async function createBankEntry(row: ClassifiedRow, fyo: Fyo, bankAccount: string) {
  const absAmount = Math.abs(row.amount);
  const isInflow = row.amount >= 0;

  const accounts = isInflow
    ? [
        { account: bankAccount, debit: absAmount, credit: 0 },
        { account: row.proposedAccount, debit: 0, credit: absAmount },
      ]
    : [
        { account: row.proposedAccount, debit: absAmount, credit: 0 },
        { account: bankAccount, debit: 0, credit: absAmount },
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
