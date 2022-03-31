import { getDefaultMetaFieldValueMap } from '../helpers';
import { DatabaseManager } from './manager';
import { FieldValueMap, Patch } from './types';

export async function runPatches(patches: Patch[], dm: DatabaseManager) {
  const list: { name: string; success: boolean }[] = [];
  for (const patch of patches) {
    const success = await runPatch(patch, dm);
    list.push({ name: patch.name, success });
  }
  return list;
}

async function runPatch(patch: Patch, dm: DatabaseManager): Promise<boolean> {
  try {
    await patch.patch.execute(dm);
  } catch (err) {
    console.error('PATCH FAILED: ', patch.name);
    console.error(err);
    return false;
  }

  await makeEntry(patch.name, dm);
  return true;
}

async function makeEntry(patchName: string, dm: DatabaseManager) {
  const defaultFieldValueMap = getDefaultMetaFieldValueMap() as FieldValueMap;
  defaultFieldValueMap.name = patchName;
  await dm.db!.insert('PatchRun', defaultFieldValueMap);
}
