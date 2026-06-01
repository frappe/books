import test from 'tape';
import { classifyRow, classifyRows } from '../classifier';
import { BankRow } from '../types';

function row(over: Partial<BankRow> = {}): BankRow {
  return {
    accountIban: 'EE382200221020145685',
    date: '2026-05-01',
    amount: -100,
    currency: 'EUR',
    archivalId: 'X',
    ...over,
  };
}

test('classifier: AWS debit → EU_RC_SERVICES + 4320 - IT Services', (t) => {
  const r = classifyRow(row({ counterpartyName: 'Amazon Web Services EMEA SARL', amount: -150 }));
  t.equal(r.proposedVatCode, 'EU_RC_SERVICES');
  t.equal(r.proposedAccount, '4320 - IT Services');
  t.equal(r.side, 'purchase');
  t.equal(r.matchedRuleId, 'aws-eu');
  t.end();
});

test('classifier: Apple credit → ZERO_EXPORT + 3025 - Service Exports', (t) => {
  const r = classifyRow(row({ counterpartyName: 'Apple Inc', amount: 3200 }));
  t.equal(r.proposedVatCode, 'ZERO_EXPORT');
  t.equal(r.proposedAccount, '3025 - Service Exports');
  t.equal(r.side, 'sales');
  t.end();
});

test('classifier: sign filter excludes wrong-direction match', (t) => {
  const r = classifyRow(row({ counterpartyName: 'Amazon Web Services EMEA SARL', amount: 50 }));
  t.notEqual(r.matchedRuleId, 'aws-eu');
  t.end();
});

test('classifier: unmatched → null vatCode + trade account fallback', (t) => {
  const r1 = classifyRow(row({ counterpartyName: 'Random Vendor', amount: -42 }));
  t.equal(r1.proposedVatCode, null);
  t.equal(r1.proposedAccount, '2110 - Trade Payables');
  t.equal(r1.side, 'unknown');

  const r2 = classifyRow(row({ counterpartyName: 'Random Customer', amount: 99 }));
  t.equal(r2.proposedAccount, '1200 - Trade Receivables');
  t.end();
});

test('classifier: classifyRows preserves row count', (t) => {
  const rows = [row(), row({ archivalId: 'Y' }), row({ archivalId: 'Z' })];
  t.equal(classifyRows(rows).length, 3);
  t.end();
});
