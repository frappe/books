import { getDefaultMetaFieldValueMap } from '../../backend/helpers';
import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  const names: Record<string, string> = {
    StockMovement: 'SMOV-',
    Shipment: 'SHP-',
  };

  for (const referenceType in names) {
    const name = names[referenceType];
    await createNumberSeries(name, referenceType, dm);
  }
}

async function createNumberSeries(
  name: string,
  referenceType: string,
  dm: DatabaseManager
) {
  const exists = await dm.db?.exists('NumberSeries', name);
  if (exists) {
    return;
  }

  await dm.db?.insert('NumberSeries', {
    name,
    start: 1001,
    padZeros: 4,
    current: 0,
    referenceType,
    ...getDefaultMetaFieldValueMap(),
  });
}

export default { execute, beforeMigrate: true };
