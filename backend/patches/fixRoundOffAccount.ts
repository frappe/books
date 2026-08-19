import { ModelNameEnum } from '../../models/types';
import { DatabaseManager } from '../database/manager';

const FIELDNAME = 'roundOffAccount';

async function execute(dm: DatabaseManager) {
  const accounts = await dm.db!.getSingleValues(FIELDNAME);
  if (!accounts.length) {
    await testAndSetRoundOffAccount(dm);
  }

  await dm.db!.delete(ModelNameEnum.AccountingSettings, FIELDNAME);

  let isSet = false;
  for (const { parent, value } of accounts) {
    if (parent !== ModelNameEnum.AccountingSettings) {
      continue;
    }

    isSet = await setRoundOffAccountIfExists(value as string, dm);
    if (isSet) {
      break;
    }
  }

  if (!isSet) {
    await testAndSetRoundOffAccount(dm);
  }
}

async function testAndSetRoundOffAccount(dm: DatabaseManager) {
  const isSet = await setRoundOffAccountIfExists('Round Off', dm);
  if (!isSet) {
    await setRoundOffAccountIfExists('Rounded Off', dm);
  }

  return;
}

async function setRoundOffAccountIfExists(
  roundOffAccount: string,
  dm: DatabaseManager
) {
  const exists = await dm.db!.exists(ModelNameEnum.Account, roundOffAccount);
  if (!exists) {
    return false;
  }

  await dm.db!.insert(ModelNameEnum.AccountingSettings, {
    roundOffAccount,
  });
  return true;
}

export default { execute, beforeMigrate: true };
