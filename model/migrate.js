const frappe = require('frappejs');

module.exports = async function migrate(allPatches, patchOrder) {
  let executedPatchRuns = [];
  try {
    executedPatchRuns = (
      await frappe.db.getAll({ doctype: 'PatchRun', fields: ['name'] })
    ).map(d => d.name);
  } catch (error) {}

  let patchRunOrder = patchOrder
    .map(text => {
      let [patch] = text.split(' ');
      if (text && patch) {
        return {
          fileName: text,
          method: allPatches[patch]
        };
      }
    })
    .filter(Boolean);

  for (let patch of patchRunOrder) {
    if (!executedPatchRuns.includes(patch.fileName)) {
      await runPatch(patch);
    }
  }
};

async function runPatch(patch) {
  try {
    await patch.method();
    let patchRun = frappe.getNewDoc('PatchRun');
    patchRun.name = patch.fileName;
    await patchRun.insert();
  } catch (error) {
    console.error(error);
    console.log('Could not run patch', patch);
  }
}
