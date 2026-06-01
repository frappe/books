import { readFileSync } from 'fs';
import { join } from 'path';
import test from 'tape';
import { parseCamt } from '../camtParser';

const xml = readFileSync(
  join(__dirname, 'fixtures/sample.camt.053.xml'),
  'utf-8'
);

test('parseCamt: row count', (t) => {
  const rows = parseCamt(xml);
  t.equal(rows.length, 2, 'parses 2 Ntry elements');
  t.end();
});

test('parseCamt: DBIT entry → negative amount + counterparty', (t) => {
  const rows = parseCamt(xml);
  const aws = rows.find((r) => r.archivalId === 'ARCH-001');
  t.ok(aws, 'AWS row present');
  t.equal(aws?.amount, -150, 'debit amount negative');
  t.equal(aws?.counterpartyName, 'Amazon Web Services EMEA SARL');
  t.equal(aws?.counterpartyIban, 'DE89370400440532013000');
  t.equal(aws?.currency, 'EUR');
  t.equal(aws?.date, '2026-05-03');
  t.equal(aws?.referenceNumber, 'E2E001');
  t.end();
});

test('parseCamt: CRDT entry → positive amount + Dbtr name', (t) => {
  const rows = parseCamt(xml);
  const client = rows.find((r) => r.archivalId === 'ARCH-004');
  t.ok(client, 'client row present');
  t.equal(client?.amount, 1200);
  t.equal(client?.counterpartyName, 'OU Klient');
  t.equal(client?.counterpartyIban, 'EE901700017000123456');
  t.end();
});
