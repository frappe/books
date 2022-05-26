import * as assert from 'assert';
import { DatabaseManager } from 'backend/database/manager';
import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { purchaseItemPartyMap } from 'dummy/helpers';
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
      await setupDummyInstance(dbPath, fyo, 1, 25);
    }, 'setup instance failed');

    for (const item in purchaseItemPartyMap) {
      assert.strictEqual(
        await fyo.db.exists('Item', item),
        true,
        `not found ${item}`
      );

      const party = purchaseItemPartyMap[item];
      assert.strictEqual(
        await fyo.db.exists('Party', party),
        true,
        `not found ${party}`
      );
    }
  }).timeout(120_000);
});
