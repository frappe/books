import { emitMainProcessError, getDefaultMetaFieldValueMap } from '../helpers';
import { DatabaseManager } from './manager';
import { FieldValueMap, Patch } from './types';

export async function runPatches(
  patches: Patch[],
  dm: DatabaseManager,
  version: string
) {
  const list: { name: string; success: boolean }[] = [];
  for (const patch of patches) {
    const success = await runPatch(patch, dm, version);
    list.push({ name: patch.name, success });
  }
  return list;
}

async function runPatch(
  patch: Patch,
  dm: DatabaseManager,
  version: string
): Promise<boolean> {
  let failed = false;
  try {
    await patch.patch.execute(dm);
  } catch (error) {
    failed = true;
    if (error instanceof Error) {
      error.message = `Patch Failed: ${patch.name}\n${error.message}`;
      emitMainProcessError(error, { patchName: patch.name, notifyUser: false });
    }
  }

  await makeEntry(patch.name, version, failed, dm);
  return true;
}

async function makeEntry(
  patchName: string,
  version: string,
  failed: boolean,
  dm: DatabaseManager
) {
  const defaultFieldValueMap = getDefaultMetaFieldValueMap() as FieldValueMap;

  defaultFieldValueMap.name = patchName;
  defaultFieldValueMap.failed = failed;
  defaultFieldValueMap.version = version;

  await dm.db!.insert('PatchRun', defaultFieldValueMap);
}
