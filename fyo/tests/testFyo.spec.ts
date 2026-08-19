import { getRegionalModels, models } from 'models';
import { getSchemas } from 'schemas';
import test from 'tape';
import { getTestFyo } from 'tests/helpers';

test('Fyo Init', async (t) => {
  const fyo = getTestFyo();
  t.equal(Object.keys(fyo.schemaMap).length, 0, 'zero schemas');

  await fyo.db.createNewDatabase(':memory:', 'in');
  await fyo.initializeAndRegister({}, {});

  t.equal(Object.keys(fyo.schemaMap).length > 0, true, 'non zero schemas');
  await fyo.close();
});

test('Fyo Docs', async (t) => {
  const countryCode = 'in';
  const fyo = getTestFyo();
  const schemaMap = getSchemas(countryCode, []);
  const regionalModels = await getRegionalModels(countryCode);
  await fyo.db.createNewDatabase(':memory:', countryCode);
  await fyo.initializeAndRegister(models, regionalModels);

  for (const schemaName in schemaMap) {
    const schema = schemaMap[schemaName];
    if (schema?.isSingle) {
      continue;
    }

    const doc = fyo.doc.getNewDoc(schemaName);
    t.equal(doc.schemaName, schemaName, `equal schemaNames: ${schemaName}`);
  }

  await fyo.close();
});
