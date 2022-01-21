const frappe = require('frappe');

module.exports = async function runPatches(patchList) {
  const patchesAlreadyRun = (
    await frappe.db.knex('PatchRun').select('name')
  ).map(({ name }) => name);

  for (let patch of patchList) {
    if (patchesAlreadyRun.includes(patch.patchName)) {
      continue;
    }

    await runPatch(patch);
  }
};

async function runPatch({ patchName, patchFunction }) {
  try {
    await patchFunction();
    const patchRun = frappe.getNewDoc('PatchRun');
    patchRun.name = patchName;
    await patchRun.insert();
  } catch (error) {
    console.error(`could not run ${patchName}`, error);
  }
}
