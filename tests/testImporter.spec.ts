import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { readFileSync } from 'fs';
import { ModelNameEnum } from 'models/types';
import { join } from 'path';
import { Importer } from 'src/importer';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('importer init', (t) => {
  const importer = new Importer(ModelNameEnum.SalesInvoice, fyo);
  t.equal(
    typeof importer.getCSVTemplate(),
    'string',
    'csv template is a string'
  );
  t.end();
});

test('import Items', async (t) => {
  const importer = new Importer(ModelNameEnum.Item, fyo);
  const csvPath = join(__dirname, 'items.csv');
  const data = readFileSync(csvPath, { encoding: 'utf-8' });
  t.equal(importer.selectFile(data), true, 'file selection');
  t.equal((await importer.checkLinks()).length, 0, 'all links exist');
  t.doesNotThrow(() => importer.populateDocs(), 'populating docs');
  for (const doc of importer.docs) {
    await assertDoesNotThrow(async () => await doc.sync());
  }
});

test('import Party', async (t) => {
  const importer = new Importer(ModelNameEnum.Party, fyo);
  const csvPath = join(__dirname, 'parties.csv');
  const data = readFileSync(csvPath, { encoding: 'utf-8' });
  t.equal(importer.selectFile(data), true, 'file selection');
  t.equal((await importer.checkLinks()).length, 0, 'all links exist');
  t.doesNotThrow(() => importer.populateDocs(), 'populating docs');
  for (const doc of importer.docs) {
    await assertDoesNotThrow(async () => await doc.sync());
  }
});

test('import SalesInvoices', async (t) => {
  const importer = new Importer(ModelNameEnum.SalesInvoice, fyo);
  const csvPath = join(__dirname, 'sales_invoices.csv');
  const data = readFileSync(csvPath, { encoding: 'utf-8' });

  t.equal(importer.selectFile(data), true, 'file selection');
  t.equal((await importer.checkLinks()).length, 0, 'all links exist');
  t.doesNotThrow(() => importer.populateDocs(), 'populating docs');

  const names = [];
  for (const doc of importer.docs.slice(0, 2)) {
    await assertDoesNotThrow(async () => await doc.sync());
    names.push(doc.name);
  }

  t.ok(
    names.every((n) => n?.startsWith('SINV-')),
    'numberSeries assigned'
  );
});

closeTestFyo(fyo, __filename);
