import * as assert from 'assert';
import 'mocha';
import models, { getRegionalModels } from 'models';
import { getSchemas } from 'schemas';
import { Frappe } from '..';
import { DatabaseManager } from '../../backend/database/manager';
import { DummyAuthDemux } from './helpers';

describe('Frappe', function () {
  const frappe = new Frappe({
    DatabaseDemux: DatabaseManager,
    AuthDemux: DummyAuthDemux,
    isTest: true,
    isElectron: false,
  });

  specify('Init', async function () {
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length,
      0,
      'zero schemas one'
    );

    assert.strictEqual(
      Object.keys(frappe.schemaMap).length,
      0,
      'zero schemas two'
    );

    await frappe.db.createNewDatabase(':memory:', 'in');
    await frappe.initializeAndRegister({}, {});
    assert.strictEqual(
      Object.keys(frappe.schemaMap).length > 0,
      true,
      'non zero schemas'
    );
    await frappe.db.close();
  });
});

describe('Frappe', function () {
  const countryCode = 'in';
  let frappe: Frappe;
  const schemas = getSchemas(countryCode);
  this.beforeEach(async function () {
    frappe = new Frappe({
      DatabaseDemux: DatabaseManager,
      isTest: true,
      isElectron: false,
    });

    const regionalModels = await getRegionalModels(countryCode);
    await frappe.db.createNewDatabase(':memory:', countryCode);
    await frappe.initializeAndRegister(models, regionalModels);
  });

  this.afterEach(async function () {
    await frappe.close();
  });

  specify('temp', async function () {
    frappe.db.schemaMap;
  });
});
