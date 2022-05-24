import fs from 'fs/promises';
import { RawValueMap } from 'fyo/core/types';
import { Knex } from 'knex';
import { ModelNameEnum } from 'models/types';
import os from 'os';
import path from 'path';
import { SchemaMap } from 'schemas/types';
import { changeKeys, deleteKeys, invertMap } from 'utils';
import { getCountryCodeFromCountry } from 'utils/misc';
import { Version } from 'utils/version';
import { DatabaseManager } from '../database/manager';

const ignoreColumns = ['keywords'];
const columnMap = { creation: 'created', owner: 'createdBy' };
const childTableColumnMap = {
  parenttype: 'parentSchemaName',
  parentfield: 'parentFieldname',
};

const defaultNumberSeriesMap = {
  [ModelNameEnum.Payment]: 'PAY-',
  [ModelNameEnum.JournalEntry]: 'JE-',
  [ModelNameEnum.SalesInvoice]: 'SINV-',
  [ModelNameEnum.PurchaseInvoice]: 'PINV-',
} as Record<ModelNameEnum, string>;

async function execute(dm: DatabaseManager) {
  const sourceKnex = dm.db!.knex!;
  const version = (
    await sourceKnex('SingleValue')
      .select('value')
      .where({ fieldname: 'version' })
  )?.[0]?.value;

  /**
   * Versions after this should have the new schemas
   */

  if (version && Version.gt(version, '0.4.3-beta.0')) {
    return;
  }

  /**
   * Initialize a different db to copy all the updated
   * data into.
   */
  const countryCode = await getCountryCode(sourceKnex);
  const destDm = await getDestinationDM(sourceKnex, countryCode);

  /**
   * Copy data from all the relevant tables
   * the other tables will be empty cause unused.
   */
  await copyData(sourceKnex, destDm);

  /**
   * Version will update when migration completes, this
   * is set to prevent this patch from running again.
   */
  await destDm.db!.update(ModelNameEnum.SystemSettings, {
    version: '0.5.0-beta.0',
  });

  /**
   * Replace the database with the new one.
   */
  await replaceDatabaseCore(dm, destDm);
}

async function replaceDatabaseCore(
  dm: DatabaseManager,
  destDm: DatabaseManager
) {
  const sourceDbPath = destDm.db!.dbPath; // new db with new schema
  const destDbPath = dm.db!.dbPath; // old db to be replaced

  await dm.db!.close();
  await destDm.db!.close();

  await fs.copyFile(sourceDbPath, destDbPath);
  await dm._connect(destDbPath);
}

async function copyData(sourceKnex: Knex, destDm: DatabaseManager) {
  const destKnex = destDm.db!.knex!;
  const schemaMap = destDm.getSchemaMap();
  await destKnex!.raw('PRAGMA foreign_keys=OFF');
  await copySingleValues(sourceKnex, destKnex, schemaMap);
  await copyParty(sourceKnex, destKnex);
  await copyItem(sourceKnex, destKnex);
  await copyChildTables(sourceKnex, destKnex, schemaMap);
  await copyOtherTables(sourceKnex, destKnex);
  await copyTransactionalTables(sourceKnex, destKnex);
  await copyLedgerEntries(sourceKnex, destKnex);
  await copyNumberSeries(sourceKnex, destKnex);
  await destKnex!.raw('PRAGMA foreign_keys=ON');
}

async function copyNumberSeries(sourceKnex: Knex, destKnex: Knex) {
  const values = (await sourceKnex(
    ModelNameEnum.NumberSeries
  )) as RawValueMap[];

  const refMap = invertMap(defaultNumberSeriesMap);

  for (const value of values) {
    if (value.referenceType) {
      continue;
    }

    const name = value.name as string;
    const referenceType = refMap[name];
    const indices = await sourceKnex.raw(
      `
      select cast(substr(name, ??) as int) as idx
      from ?? 
      order by idx desc 
      limit 1`,
      [name.length + 1, referenceType]
    );

    value.start = 1001;
    value.current = indices[0]?.idx ?? value.current ?? value.start;
    value.referenceType = referenceType;
  }

  await copyValues(destKnex, ModelNameEnum.NumberSeries, values);
}

async function copyLedgerEntries(sourceKnex: Knex, destKnex: Knex) {
  const values = (await sourceKnex(
    ModelNameEnum.AccountingLedgerEntry
  )) as RawValueMap[];
  await copyValues(destKnex, ModelNameEnum.AccountingLedgerEntry, values, [
    'description',
    'againstAccount',
    'balance',
  ]);
}

async function copyOtherTables(sourceKnex: Knex, destKnex: Knex) {
  const schemaNames = [
    ModelNameEnum.Account,
    ModelNameEnum.Currency,
    ModelNameEnum.Address,
    ModelNameEnum.Color,
    ModelNameEnum.Tax,
  ];

  for (const sn of schemaNames) {
    const values = (await sourceKnex(sn)) as RawValueMap[];
    await copyValues(destKnex, sn, values);
  }
}

async function copyTransactionalTables(sourceKnex: Knex, destKnex: Knex) {
  const schemaNames = [
    ModelNameEnum.JournalEntry,
    ModelNameEnum.Payment,
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.PurchaseInvoice,
  ];

  for (const sn of schemaNames) {
    const values = (await sourceKnex(sn)) as RawValueMap[];
    values.forEach((v) => {
      if (!v.submitted) {
        v.submitted = 0;
      }

      if (!v.cancelled) {
        v.cancelled = 0;
      }

      if (!v.numberSeries) {
        v.numberSeries = defaultNumberSeriesMap[sn];
      }
    });
    await copyValues(destKnex, sn, values, [], childTableColumnMap);
  }
}

async function copyChildTables(
  sourceKnex: Knex,
  destKnex: Knex,
  schemaMap: SchemaMap
) {
  const childSchemaNames = Object.keys(schemaMap).filter(
    (sn) => schemaMap[sn]?.isChild
  );

  for (const sn of childSchemaNames) {
    const values = (await sourceKnex(sn)) as RawValueMap[];
    await copyValues(destKnex, sn, values, [], childTableColumnMap);
  }
}

async function copyItem(sourceKnex: Knex, destKnex: Knex) {
  const values = (await sourceKnex(ModelNameEnum.Item)) as RawValueMap[];
  values.forEach((value) => {
    value.for = 'Both';
  });

  await copyValues(destKnex, ModelNameEnum.Item, values);
}

async function copyParty(sourceKnex: Knex, destKnex: Knex) {
  const values = (await sourceKnex(ModelNameEnum.Party)) as RawValueMap[];
  values.forEach((value) => {
    // customer will be mapped onto role
    if (Number(value.supplier) === 1) {
      value.customer = 'Supplier';
    } else {
      value.customer = 'Customer';
    }
  });

  await copyValues(
    destKnex,
    ModelNameEnum.Party,
    values,
    ['supplier', 'addressDisplay'],
    { customer: 'role' }
  );
}

async function copySingleValues(
  sourceKnex: Knex,
  destKnex: Knex,
  schemaMap: SchemaMap
) {
  const singleSchemaNames = Object.keys(schemaMap).filter(
    (k) => schemaMap[k]?.isSingle
  );
  const singleValues = (await sourceKnex(ModelNameEnum.SingleValue).whereIn(
    'parent',
    singleSchemaNames
  )) as RawValueMap[];

  await copyValues(destKnex, ModelNameEnum.SingleValue, singleValues);
}

async function copyValues(
  destKnex: Knex,
  destTableName: string,
  values: RawValueMap[],
  keysToDelete: string[] = [],
  keyMap: Record<string, string> = {}
) {
  keysToDelete = [...keysToDelete, ...ignoreColumns];
  keyMap = { ...keyMap, ...columnMap };

  values = values.map((sv) => deleteKeys(sv, keysToDelete));
  values = values.map((sv) => changeKeys(sv, keyMap));

  await destKnex.batchInsert(destTableName, values, 100);
}

async function getDestinationDM(knex: Knex, countryCode: string) {
  /**
   * This is where all the stuff from the old db will be copied.
   * That won't be altered cause schema update will cause data loss.
   */
  const dbPath = path.join(os.tmpdir(), '__patch_db.db');
  const dm = new DatabaseManager();
  await dm.createNewDatabase(dbPath, countryCode);
  return dm;
}

async function getCountryCode(knex: Knex) {
  /**
   * Need to account for schema changes, in 0.4.3-beta.0
   */
  const country = (
    await knex('SingleValue').select('value').where({ fieldname: 'country' })
  )?.[0]?.value;

  if (!country) {
    return '';
  }

  return getCountryCodeFromCountry(country);
}

export default { execute, beforeMigrate: true };
