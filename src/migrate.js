import frappe from 'frappejs';
import migrate from 'frappejs/model/migrate';
import patchesTxt from '../patches/patches.txt';
const requirePatch = require.context('../patches', true, /\w+\.(js)$/);

export default async function runMigrate() {
  let patchOrder = patchesTxt.split('\n');
  let allPatches = {};
  requirePatch.keys().forEach(fileName => {
    if (fileName === './index.js') return;
    let method;
    try {
      method = requirePatch(fileName);
    } catch (error) {
      console.error(error);
      method = null;
    }
    fileName = fileName.slice(2, -3);
    if (fileName && method) {
      allPatches[fileName] = method;
    }
  });
  await migrate(allPatches, patchOrder);
  await frappe.db.migrate();
};
