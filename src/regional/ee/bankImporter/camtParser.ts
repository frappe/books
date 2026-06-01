import { XMLParser } from 'fast-xml-parser';
import { BankRow } from './types';

export function parseCamt(xml: string): BankRow[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
  });
  const doc = parser.parse(xml) as Record<string, unknown>;

  const root = pick(doc, 'Document', 'BkToCstmrStmt') as
    | Record<string, unknown>
    | undefined;
  if (!root) return [];

  const stmts = asArray(root.Stmt) as Record<string, unknown>[];
  const rows: BankRow[] = [];

  for (const stmt of stmts) {
    const accountIban =
      (pick(stmt, 'Acct', 'Id', 'IBAN') as string | undefined) ?? '';
    const entries = asArray(stmt.Ntry) as Record<string, unknown>[];

    for (const ntry of entries) {
      const cdtDbt = (ntry.CdtDbtInd as string | undefined) ?? '';
      const amtRaw = ntry.Amt as
        | { '#text'?: string; '@_Ccy'?: string }
        | string
        | undefined;
      const { amount, currency } = parseAmt(amtRaw, cdtDbt);
      const date =
        (pick(ntry, 'BookgDt', 'Dt') as string | undefined) ??
        (pick(ntry, 'ValDt', 'Dt') as string | undefined) ??
        '';
      const archivalId =
        (ntry.AcctSvcrRef as string | undefined) ??
        (pick(ntry, 'NtryDtls', 'TxDtls', 'Refs', 'AcctSvcrRef') as
          | string
          | undefined) ??
        '';

      const txDtls = pick(ntry, 'NtryDtls', 'TxDtls') as
        | Record<string, unknown>
        | undefined;
      const rltd = (txDtls?.RltdPties ?? {}) as Record<string, unknown>;

      const isDebit = cdtDbt === 'DBIT';
      const cpty = isDebit ? rltd.Cdtr : rltd.Dbtr;
      const cptyAcct = isDebit ? rltd.CdtrAcct : rltd.DbtrAcct;
      const counterpartyName =
        ((cpty as Record<string, unknown> | undefined)?.Nm as
          | string
          | undefined) ?? undefined;
      const counterpartyIban =
        (pick(cptyAcct as Record<string, unknown> | undefined, 'Id', 'IBAN') as
          | string
          | undefined) ?? undefined;

      const remittance =
        (pick(txDtls, 'RmtInf', 'Ustrd') as string | undefined) ?? undefined;
      const referenceNumber =
        (pick(txDtls, 'Refs', 'EndToEndId') as string | undefined) ?? undefined;
      const agt = (isDebit ? rltd.CdtrAgt : rltd.DbtrAgt) as
        | Record<string, unknown>
        | undefined;
      const bic =
        (pick(agt, 'FinInstnId', 'BIC') as string | undefined) ?? undefined;

      if (!archivalId) continue;

      rows.push({
        accountIban,
        date,
        counterpartyIban,
        counterpartyName,
        amount,
        currency,
        remittance,
        referenceNumber,
        archivalId,
        bic,
      });
    }
  }

  return rows;
}

function parseAmt(
  amt: { '#text'?: string; '@_Ccy'?: string } | string | undefined,
  cdtDbt: string
): { amount: number; currency: string } {
  if (amt === undefined) return { amount: 0, currency: 'EUR' };
  if (typeof amt === 'string') {
    const n = Number(amt);
    return signAmount(n, cdtDbt, 'EUR');
  }
  const n = Number(amt['#text'] ?? '0');
  const ccy = amt['@_Ccy'] ?? 'EUR';
  return signAmount(n, cdtDbt, ccy);
}

function signAmount(
  n: number,
  cdtDbt: string,
  ccy: string
): { amount: number; currency: string } {
  const abs = Math.abs(Number.isFinite(n) ? n : 0);
  return {
    amount: cdtDbt === 'DBIT' ? -abs : abs,
    currency: ccy,
  };
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function pick(
  obj: Record<string, unknown> | undefined,
  ...keys: string[]
): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in cur) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur;
}
