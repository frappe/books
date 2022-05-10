import { DatabaseManager } from 'backend/database/manager';
import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { Fyo } from 'fyo';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import 'mocha';
import { getTestDbPath } from 'tests/helpers';
import { setupDummyInstance } from '..';

describe('dummy', function () {
  const dbPath = getTestDbPath();

  let fyo: Fyo;

  this.beforeAll(function () {
    fyo = new Fyo({
      DatabaseDemux: DatabaseManager,
      AuthDemux: DummyAuthDemux,
      isTest: true,
      isElectron: false,
    });
  });

  this.afterAll(async function () {
    await fyo.close();
  });

  specify('setupDummyInstance', async function () {
    await assertDoesNotThrow(async () => {
      await setupDummyInstance(dbPath, fyo);
    }, 'setup instance failed');
  });
});
