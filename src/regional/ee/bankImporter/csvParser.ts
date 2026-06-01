import { BankRow } from './types';

const FIELD_SEPARATORS = [';', ',', '\t'] as const;

export function parseLhvCsv(text: string): BankRow[] {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r\n|\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  const sep = sniffSeparator(lines[0]);
  const decimalIsComma = sniffDecimalIsComma(lines.slice(1), sep);
  const startIdx = looksLikeData(lines[0], sep) ? 0 : 1;

  const rows: BankRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 11) continue;

    const date = parseEstDate(cols[2]);
    const rawAmount = cols[6] ?? '';
    const amount = parseAmount(rawAmount, decimalIsComma);
    const dcInd = (cols[5] ?? '').toUpperCase();
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
