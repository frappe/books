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
  autoSubmitted: boolean;
  draftNames: string[];
}

export interface BuildOptions {
  autoSubmit?: boolean;
}

export async function buildJournalEntries(
  rows: ClassifiedRow[],
  fyo: Fyo,
  bankAccount: string,
  options: BuildOptions = {}
): Promise<BuildResult> {
  const autoSubmit = options.autoSubmit ?? true;
  const result: BuildResult = {
    bankEntries: 0,
    reverseChargeEntries: 0,
    duplicatesSkipped: [],
    errors: [],
    autoSubmitted: autoSubmit,
    draftNames: [],
  };

  for (const row of rows) {
    try {
      const existing = (await fyo.db.getAll(ModelNameEnum.JournalEntry, {
        fields: ['name'],
        filters: { lhvArchivalId: row.archivalId, cancelled: false },
        limit: 1,
      })) as { name: string }[];

      if (existing.length > 0) {
        result.duplicatesSkipped.push(row.archivalId);
        continue;
      }

      const bankName = await createBankEntry(row, fyo, bankAccount, autoSubmit);
      result.bankEntries += 1;
      if (!autoSubmit && bankName) result.draftNames.push(bankName);

      if (row.proposedVatCode && isReverseCharge(row.proposedVatCode)) {
        const rcName = await createReverseChargeEntry(row, fyo, autoSubmit);
        if (rcName) {
          result.reverseChargeEntries += 1;
          if (!autoSubmit) result.draftNames.push(rcName);
        }
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

async function createBankEntry(
  row: ClassifiedRow,
  fyo: Fyo,
  bankAccount: string,
  autoSubmit: boolean
): Promise<string> {
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
  if (autoSubmit) await doc.submit();
  return doc.name!;
}

async function createReverseChargeEntry(
  row: ClassifiedRow,
  fyo: Fyo,
  autoSubmit: boolean
): Promise<string | null> {
  if (!row.proposedVatCode) return null;
  const spec = VAT_CODES[row.proposedVatCode];
  if (!spec || !spec.reverseCharge || spec.rate === 0) return null;

  const net = Math.abs(row.amount);
  const vatAmount = round2(net * (spec.rate / 100));
  if (vatAmount === 0) return null;

  const rcArchivalId = `${row.archivalId}-RC`;

  const existingRc = (await fyo.db.getAll(ModelNameEnum.JournalEntry, {
    fields: ['name'],
    filters: { lhvArchivalId: rcArchivalId, cancelled: false },
    limit: 1,
  })) as { name: string }[];
  if (existingRc.length > 0) return null;

  const doc = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
    entryType: 'Journal Entry',
    date: new Date(row.date),
    accounts: [
      { account: RC_RECEIVABLE, debit: vatAmount, credit: 0 },
      { account: RC_PAYABLE, debit: 0, credit: vatAmount },
    ],
    referenceNumber: row.referenceNumber ?? row.documentNumber,
    userRemark: `Reverse charge VAT (${row.proposedVatCode}) for ${row.archivalId}`,
    lhvArchivalId: rcArchivalId,
    lhvVatCode: row.proposedVatCode,
  });

  await doc.sync();
  if (autoSubmit) await doc.submit();
  return doc.name!;
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
