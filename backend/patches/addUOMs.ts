import { ModelNameEnum } from '../../models/types';
import { DatabaseManager } from '../database/manager';
import { getDefaultMetaFieldValueMap } from '../helpers';

const defaultUOMs = [
  {
    name: `Unit`,
    isWhole: true,
  },
  {
    name: `Kg`,
    isWhole: false,
  },
  {
    name: `Gram`,
    isWhole: false,
  },
  {
    name: `Meter`,
    isWhole: false,
  },
  {
    name: `Hour`,
    isWhole: false,
  },
  {
    name: `Day`,
    isWhole: false,
  },
];

async function execute(dm: DatabaseManager) {
  for (const uom of defaultUOMs) {
    const defaults = getDefaultMetaFieldValueMap();
    await dm.db?.insert(ModelNameEnum.UOM, { ...uom, ...defaults });
  }
}

export default { execute };
