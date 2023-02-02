import { ModelNameEnum } from 'models/types';
import { Importer } from 'src/importer';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('importer', async (t) => {
  const importer = new Importer(ModelNameEnum.SalesInvoice, fyo);
  t.ok(importer.getCSVTemplate());
});

closeTestFyo(fyo, __filename);
