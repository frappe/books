import { ModelNameEnum } from '../../models/types';
import { defaultUOMs } from '../../utils/defaults';
import { DatabaseManager } from '../database/manager';
import { getDefaultMetaFieldValueMap } from '../helpers';

async function execute(dm: DatabaseManager) {
  for (const uom of defaultUOMs) {
    const defaults = getDefaultMetaFieldValueMap();
    await dm.db?.insert(ModelNameEnum.UOM, { ...uom, ...defaults });
  }
}

export default { execute };
