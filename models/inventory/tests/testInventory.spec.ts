import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { dummyItems } from './helpers';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

test('create dummy items', async (t) => {
  for (const item of dummyItems) {
    const doc = fyo.doc.getNewDoc(ModelNameEnum.Item, item);
    t.ok(await doc.sync(), `${item.name} created`);
  }
});

test('check dummy items', async (t) => {
  for (const { name } of dummyItems) {
    const exists = await fyo.db.exists(ModelNameEnum.Item, name);
    t.ok(exists, `${name} exists`);
  }
});

closeTestFyo(fyo, __filename);
