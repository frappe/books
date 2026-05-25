import { LhvRow } from './types';

/**
 * Parse an LHV internet-bank CSV export.
 *
 * Format (valid from 25.02.2026):
 *   col 1: Client account (IBAN)
 *   col 2: Document number
 *   col 3: Date (DD.MM.YYYY)
 *   col 4: Counterparty IBAN
 *   col 5: Counterparty name
 *   col 6: D/C indicator ('D' debit, 'C' credit)
 *   col 7: Amount (debit shown with minus)
 *   col 8: Reference number
 *   col 9: Archival ID
 *   col 10: Payment details
 *   col 11: Currency
 *   col 12: Party ident code
 *   col 13: Bank BIC
 *   col 14: Payment initiator's name
 *   col 15: Entry reference
 *   col 16: Bank's unique payment reference
 *
 * Field and decimal separators are user-configurable in LHV portal.
 * We sniff the first non-empty line to pick a field separator.
 */

const FIELD_SEPARATORS = [';', ',', '\t'] as const;

export function parseLhvCsv(text: string): LhvRow[] {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r\n|\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  const sep = sniffSeparator(lines[0]);
  const decimalIsComma = sniffDecimalIsComma(lines.slice(1), sep);

  // First row is a header in LHV exports; detect by checking col 1 looks IBAN-ish.
  const startIdx = looksLikeData(lines[0], sep) ? 0 : 1;

  const rows: LhvRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 11) continue;

    const date = parseEstDate(cols[2]);
    const rawAmount = cols[6] ?? '';
    const amount = parseAmount(rawAmount, decimalIsComma);
    const dcInd = (cols[5] ?? '').toUpperCase();
    // LHV convention: D-amounts come with minus already. Belt + suspenders.
    const signed = dcInd === 'D' && amount > 0 ? -amount : amount;

    rows.push({
      accountIban: cols[0],
      documentNumber: cols[1] || undefined,
      date,
      counterpartyIban: cols[3] || undefined,
      counterpartyName: cols[4] || undefined,
      amount: signed,
      currency: cols[10] || 'EUR',
      remittance: cols[9] || undefined,
      referenceNumber: cols[7] || undefined,
      archivalId: cols[8],
      bic: cols[12] || undefined,
    });
  }

  return rows;
}

function sniffSeparator(line: string): string {
  let best = FIELD_SEPARATORS[0] as string;
  let bestCount = -1;
  for (const sep of FIELD_SEPARATORS) {
    const count = line.split(sep).length;
    if (count > bestCount) {
      best = sep;
      bestCount = count;
    }
  }
  return best;
}

function sniffDecimalIsComma(dataLines: string[], sep: string): boolean {
  // If any amount cell contains a dot followed by 1-2 digits at end, decimal is dot.
  // If it contains a comma in that position, decimal is comma.
  let dot = 0;
  let comma = 0;
  for (const line of dataLines.slice(0, 20)) {
    const cols = splitCsvLine(line, sep);
    const amt = cols[6] ?? '';
    if (/[\d]\.\d{1,2}$/.test(amt)) dot++;
    if (/[\d],\d{1,2}$/.test(amt)) comma++;
  }
  return comma > dot;
}

function looksLikeData(line: string, sep: string): boolean {
  const cols = splitCsvLine(line, sep);
  // Estonian IBAN starts with EE + 2 digits.
  return /^EE\d/.test(cols[0] ?? '');
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (!inQuote && c === sep) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseEstDate(raw: string): string {
  // Accept DD.MM.YYYY, YYYY-MM-DD, or DD/MM/YYYY.
  const m1 = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  const m2 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m2) return raw;
  const m3 = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}`;
  return raw;
}

function parseAmount(raw: string, decimalIsComma: boolean): number {
  let s = raw.replace(/\s/g, '');
  if (decimalIsComma) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
