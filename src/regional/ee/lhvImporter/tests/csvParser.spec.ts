import { readFileSync } from 'fs';
import { join } from 'path';
import test from 'tape';
import { parseLhvCsv } from '../csvParser';

const csv = readFileSync(join(__dirname, 'fixtures/sample.csv'), 'utf-8');

test('parseLhvCsv: row count', (t) => {
  const rows = parseLhvCsv(csv);
  t.equal(rows.length, 5, 'parses all 5 data rows');
  t.end();
});

test('parseLhvCsv: AWS row signed amount + counterparty', (t) => {
  const rows = parseLhvCsv(csv);
  const aws = rows.find((r) => r.archivalId === 'ARCH-001');
  t.ok(aws, 'AWS row present');
  t.equal(aws?.amount, -150, 'debit amount negative');
  t.equal(aws?.counterpartyName, 'Amazon Web Services EMEA SARL');
  t.equal(aws?.currency, 'EUR');
  t.equal(aws?.date, '2026-05-03', 'date parsed to ISO');
  t.end();
});

test('parseLhvCsv: Apple credit row positive', (t) => {
  const rows = parseLhvCsv(csv);
  const apple = rows.find((r) => r.archivalId === 'ARCH-003');
  t.ok(apple, 'Apple row present');
  t.equal(apple?.amount, 3200, 'credit amount positive');
  t.equal(apple?.currency, 'USD');
  t.end();
});

test('parseLhvCsv: comma-decimal sniff', (t) => {
  // Replace every decimal dot in amount values (cols delimited by ;).
  // Sniff picks comma when most amount cells contain it.
  const commaCsv = csv.replace(/(["';])(-?\d+)\.(\d{2})(["';])/g, '$1$2,$3$4');
  const rows = parseLhvCsv(commaCsv);
  const aws = rows.find((r) => r.archivalId === 'ARCH-001');
  t.equal(aws?.amount, -150, 'comma decimal still parses');
  t.end();
});
