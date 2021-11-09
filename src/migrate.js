import frappe from 'frappejs';
import runPatches from 'frappejs/model/runPatches';
import patchesTxt from '../patches/patches.txt';
const requirePatch = require.context('../patches', true, /\w+\.(js)$/);

export default async function runMigrate() {
  if (await canRunPatches()) {
    const patchOrder = patchesTxt.split('\n');
    const allPatches = getAllPatches();
    await runPatches(allPatches, patchOrder);
  }
  await frappe.db.migrate();
}

async function canRunPatches() {
  return (
    (await frappe.db
      .knex('sqlite_master')
      .where({ type: 'table', name: 'PatchRun' })
      .select('name').length) > 0
  );
}

async function getAllPatches() {
  const allPatches = {};
  requirePatch.keys().forEach((fileName) => {
    if (fileName === './index.js') return;
    let method;
    try {
      method = requirePatch(fileName).default;
    } catch (error) {
      console.error(error);
      method = null;
    }
    fileName = fileName.slice(2, -3);
    if (fileName && method) {
      allPatches[fileName] = method;
    }
  });
  return allPatches;
}
