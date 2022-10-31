import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { purchaseItemPartyMap } from 'dummy/helpers';
import test from 'tape';
import { getTestDbPath, getTestFyo } from 'tests/helpers';
import { setupDummyInstance } from '..';

const dbPath = getTestDbPath();
const fyo = getTestFyo();

test('setupDummyInstance', async () => {
  await assertDoesNotThrow(async () => {
    await setupDummyInstance(dbPath, fyo, 1, 25);
  }, 'setup instance failed');
});

test('purchaseItemParty Existance', async (t) => {
  for (const item in purchaseItemPartyMap) {
    t.ok(await fyo.db.exists('Item', item), `item exists: ${item}`);

    const party = purchaseItemPartyMap[item];
    t.ok(await fyo.db.exists('Party', party), `party exists: ${party}`);
  }
});

test.onFinish(async () => {
  await fyo.close();
});
