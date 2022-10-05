import { getDefaultMetaFieldValueMap } from '../../backend/helpers';
import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  const schemaName = 'NumberSeries';
  const name = 'SMOV-';
  const exists = await dm.db?.exists(schemaName, name);
  if (exists) {
    return;
  }

  await dm.db?.insert(schemaName, {
    name,
    start: 1001,
    padZeros: 4,
    current: 0,
    referenceType: 'StockMovement',
    ...getDefaultMetaFieldValueMap(),
  });
}

export default { execute, beforeMigrate: true };
