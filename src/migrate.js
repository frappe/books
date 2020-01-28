const frappe = require('frappejs');
const migrate = require('frappejs/model/migrate');
const patchesTxt = require('../patches/patches.txt').default;
const requirePatch = require.context('../patches', true, /\w+\.(js)$/);

module.exports = async function runMigrate() {
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
