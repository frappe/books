import 'mocha';
import { DatabaseManager } from '../backend/database/manager';
import { Frappe } from '../frappe';

describe('Frappe', function () {
  const frappe = new Frappe(DatabaseManager);

  specify('Init', async function () {
    await frappe.init();
    await frappe.db.connectToDatabase(':memory:');
  });
});
