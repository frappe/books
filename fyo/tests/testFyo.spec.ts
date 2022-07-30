import * as assert from 'assert';
import 'mocha';
import { getRegionalModels, models } from 'models';
import { getSchemas } from 'schemas';
import { Fyo } from '..';
import { DatabaseManager } from '../../backend/database/manager';
import { DummyAuthDemux } from './helpers';

describe('Fyo Init', function () {
  const fyo = new Fyo({
    DatabaseDemux: DatabaseManager,
    AuthDemux: DummyAuthDemux,
    isTest: true,
    isElectron: false,
  });

  specify('Init', async function () {
    assert.strictEqual(
      Object.keys(fyo.schemaMap).length,
      0,
      'zero schemas one'
    );

    assert.strictEqual(
      Object.keys(fyo.schemaMap).length,
      0,
      'zero schemas two'
    );

    await fyo.db.createNewDatabase(':memory:', 'in');
    await fyo.initializeAndRegister({}, {});
    assert.strictEqual(
      Object.keys(fyo.schemaMap).length > 0,
      true,
      'non zero schemas'
    );
    await fyo.db.purgeCache();
  });
});

describe('Fyo Docs', function () {
  const countryCode = 'in';
  let fyo: Fyo;
  const schemaMap = getSchemas(countryCode);
  this.beforeEach(async function () {
    fyo = new Fyo({
      DatabaseDemux: DatabaseManager,
      isTest: true,
      isElectron: false,
    });

    const regionalModels = await getRegionalModels(countryCode);
    await fyo.db.createNewDatabase(':memory:', countryCode);
    await fyo.initializeAndRegister(models, regionalModels);
  });

  this.afterEach(async function () {
    await fyo.close();
  });

  specify('getNewDoc', async function () {
    for (const schemaName in schemaMap) {
      const schema = schemaMap[schemaName];
      if (schema?.isSingle) {
        continue;
      }

      const doc = fyo.doc.getNewDoc(schemaName);
    }
  });
});
