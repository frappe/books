import { ClassifiedRow, ClassifierRule, LhvRow } from './types';
import { DEFAULT_RULES } from './rules';

export function classifyRows(
  rows: LhvRow[],
  rules: ClassifierRule[] = DEFAULT_RULES
): ClassifiedRow[] {
  return rows.map((row) => classifyRow(row, rules));
}

export function classifyRow(
  row: LhvRow,
  rules: ClassifierRule[] = DEFAULT_RULES
): ClassifiedRow {
  for (const rule of rules) {
    if (matches(row, rule)) {
      return {
        ...row,
        proposedVatCode: rule.vatCode,
        proposedAccount: rule.account,
        side: rule.side,
        matchedRuleId: rule.id,
      };
    }
  }
  return {
    ...row,
    proposedVatCode: null,
    proposedAccount: row.amount >= 0 ? 'Debtors' : 'Creditors',
    side: 'unknown',
  };
}

function matches(row: LhvRow, rule: ClassifierRule): boolean {
  const m = rule.match;

  if (m.sign === 'debit' && row.amount >= 0) return false;
  if (m.sign === 'credit' && row.amount < 0) return false;

  if (
    m.counterpartyIban &&
    row.counterpartyIban?.toUpperCase() !== m.counterpartyIban.toUpperCase()
  ) {
    return false;
  }

  if (m.counterpartyNameContains) {
    const needle = m.counterpartyNameContains.toLowerCase();
    if (!(row.counterpartyName ?? '').toLowerCase().includes(needle)) {
      return false;
    }
  }

  if (m.remittanceContains) {
    const needle = m.remittanceContains.toLowerCase();
    if (!(row.remittance ?? '').toLowerCase().includes(needle)) {
      return false;
    }
  }

  return true;
}
