import test from 'tape';
import { classifyRow, classifyRows } from '../classifier';
import { LhvRow } from '../types';

function row(over: Partial<LhvRow> = {}): LhvRow {
  return {
    accountIban: 'EE382200221020145685',
    date: '2026-05-01',
    amount: -100,
    currency: 'EUR',
    archivalId: 'X',
    ...over,
  };
}

test('classifier: AWS debit → EU_RC_SERVICES + Cloud Infrastructure', (t) => {
  const r = classifyRow(row({ counterpartyName: 'Amazon Web Services EMEA SARL', amount: -150 }));
  t.equal(r.proposedVatCode, 'EU_RC_SERVICES');
  t.equal(r.proposedAccount, 'Cloud Infrastructure');
  t.equal(r.side, 'purchase');
  t.equal(r.matchedRuleId, 'aws-eu');
  t.end();
});

test('classifier: Apple credit → ZERO_EXPORT + Mobile App Revenue', (t) => {
  const r = classifyRow(row({ counterpartyName: 'Apple Inc', amount: 3200 }));
  t.equal(r.proposedVatCode, 'ZERO_EXPORT');
  t.equal(r.proposedAccount, 'Mobile App Revenue');
  t.equal(r.side, 'sales');
  t.end();
});

test('classifier: sign filter excludes wrong-direction match', (t) => {
  // AWS rule has sign:debit; a hypothetical credit from AWS should not match it.
  const r = classifyRow(row({ counterpartyName: 'Amazon Web Services EMEA SARL', amount: 50 }));
  t.notEqual(r.matchedRuleId, 'aws-eu');
  t.end();
});

test('classifier: unmatched → null vatCode + Debtors/Creditors fallback', (t) => {
  const r1 = classifyRow(row({ counterpartyName: 'Random Vendor', amount: -42 }));
  t.equal(r1.proposedVatCode, null);
  t.equal(r1.proposedAccount, 'Creditors');
  t.equal(r1.side, 'unknown');

  const r2 = classifyRow(row({ counterpartyName: 'Random Customer', amount: 99 }));
  t.equal(r2.proposedAccount, 'Debtors');
  t.end();
});

test('classifier: classifyRows preserves row count', (t) => {
  const rows = [row(), row({ archivalId: 'Y' }), row({ archivalId: 'Z' })];
  t.equal(classifyRows(rows).length, 3);
  t.end();
});
