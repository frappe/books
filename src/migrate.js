import frappe from 'frappe';
import runPatches from 'frappe/model/runPatches';
import patches from '../patches/patches.json';

export default async function runMigrate() {
  const canRunPatches = await getCanRunPatches();
  if (!canRunPatches) {
    return await frappe.db.migrate();
  }

  const patchList = await fetchPatchList();
  await runPatches(patchList.filter(({ beforeMigrate }) => beforeMigrate));
  await frappe.db.migrate();
  await runPatches(patchList.filter(({ beforeMigrate }) => !beforeMigrate));
}

async function fetchPatchList() {
  return await Promise.all(
    patches.map(async ({ version, fileName, beforeMigrate }) => {
      if (typeof beforeMigrate === 'undefined') {
        beforeMigrate = true;
      }

      const patchName = `${version}/${fileName}`;
      // This import is pseudo dynamic
      // webpack runs static analysis on the static portion of the import
      // i.e. '../patches/' this may break on windows due to the path
      // delimiter used.
      //
      // Only way to fix this is probably upgrading the build from
      // webpack to something else.
      const patchFunction = (await import('../patches/' + patchName)).default;
      return { patchName, patchFunction, beforeMigrate };
    })
  );
}

async function getCanRunPatches() {
  return (
    (
      await frappe.db
        .knex('sqlite_master')
        .where({ type: 'table', name: 'PatchRun' })
        .select('name')
    ).length > 0
  );
}
