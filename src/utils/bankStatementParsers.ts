import { DateTime } from 'luxon';

export interface BankTransaction {
  date: string; // ISO Format YYYY-MM-DD
  amount: number;
  description: string;
}

export function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Clean up input (remove 'D' prefix from QIF)
  const cleanDate = dateStr.trim().replace(/^D/, '');

  // List of formats to try
  const formats = [
    'd/M/yyyy',
    'd/M/yy',
    'yyyy-MM-dd',
    'M/d/yyyy',
    'd MMM yyyy',
    'yyyyMMdd',
  ];

  for (const fmt of formats) {
    const dt = DateTime.fromFormat(cleanDate, fmt);
    if (dt.isValid) {
      return dt.toISODate();
    }
  }

  return null;
}

export function parseQIF(content: string): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const rawTxns = content.split('^');

  for (const rawTx of rawTxns) {
    const lines = rawTx.trim().split('\n');
    if (lines.length < 2) continue;

    let date: string | null = null;
    let amount = 0;
    const descParts: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const prefix = line[0].toUpperCase();
      const data = line.substring(1).trim();

      switch (prefix) {
        case 'D':
          date = parseDate(data);
          break;
        case 'T':
          amount = parseFloat(data.replace(/,/g, ''));
          break;
        case 'P': // Payee
        case 'M': // Memo
        case 'L': // Category
          descParts.push(data);
          break;
      }
    }

    if (date) {
      transactions.push({
        date,
        amount,
        description: descParts.join(' / '),
      });
    }
  }
  return transactions;
}

export function parseOFX(content: string): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const blockMatch = content.match(/<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/i);
  if (!blockMatch) return [];

  const tranListContent = blockMatch[1];
  const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = txRegex.exec(tranListContent)) !== null) {
    const txContent = match[1];

    const dateMatch = txContent.match(/<DTPOSTED>(\d{8})/i);
    const amtMatch = txContent.match(/<TRNAMT>([-\d.]+)/i);
    const nameMatch = txContent.match(/<NAME>(.*?)<\/NAME>/i);
    const memoMatch = txContent.match(/<MEMO>(.*?)<\/MEMO>/i);

    if (dateMatch && amtMatch) {
      const descParts = [];
      if (nameMatch) descParts.push(nameMatch[1].trim());
      if (memoMatch) descParts.push(memoMatch[1].trim());

      transactions.push({
        date: parseDate(dateMatch[1]) || '',
        amount: parseFloat(amtMatch[1]),
        description: descParts.join(' / '),
      });
    }
  }

  return transactions;
}
