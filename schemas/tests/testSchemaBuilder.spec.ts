import { cloneDeep, isEqual } from 'lodash';
import test from 'tape';
import { getMapFromList } from 'utils';
import {
  addMetaFields,
  cleanSchemas,
  getAbstractCombinedSchemas,
  getRegionalCombinedSchemas,
  setSchemaNameOnFields,
} from '../index';
import { metaSchemas } from '../schemas';
import {
  everyFieldExists,
  getTestSchemaMap,
  someFieldExists,
  subtract,
} from './helpers';

const { appSchemaMap, regionalSchemaMap } = getTestSchemaMap();
test('Meta Properties', function (t) {
  t.equal(appSchemaMap.Party.isAbstract, true);
  t.equal(appSchemaMap.Customer.extends, 'Party');
  t.equal(appSchemaMap.Account.isTree, true);
  t.equal(appSchemaMap.JournalEntryAccount.isChild, true);
  t.end();
});

test('Field Counts', function (t) {
  t.equal(appSchemaMap.Account.fields?.length, 5);
  t.equal(appSchemaMap.JournalEntry.fields?.length, 9);
  t.equal(appSchemaMap.JournalEntryAccount.fields?.length, 3);
  t.equal(appSchemaMap.Party.fields?.length, 9);
  t.equal(appSchemaMap.Customer.fields?.length, undefined);
  t.equal(regionalSchemaMap.Party.fields?.length, 2);
  t.end();
});

test('Quick Edit Field Counts', function (t) {
  t.equal(appSchemaMap.Party.quickEditFields?.length, 5);
  t.equal(regionalSchemaMap.Party.quickEditFields?.length, 8);
  t.end();
});

const regionalCombined = getRegionalCombinedSchemas(
  appSchemaMap,
  regionalSchemaMap
);

test('Field Counts', function (t) {
  t.equal(regionalCombined.Party.fields?.length, 11);
  t.end();
});

test('Quick Edit Field Counts', function (t) {
  t.equal(regionalSchemaMap.Party.quickEditFields?.length, 8);
  t.end();
});

test('Schema Equality with App Schemas', function (t) {
  t.equal(isEqual(regionalCombined.Account, appSchemaMap.Account), true);
  t.equal(
    isEqual(regionalCombined.JournalEntry, appSchemaMap.JournalEntry),
    true
  );
  t.equal(
    isEqual(
      regionalCombined.JournalEntryAccount,
      appSchemaMap.JournalEntryAccount
    ),
    true
  );
  t.equal(isEqual(regionalCombined.Customer, appSchemaMap.Customer), true);
  t.equal(isEqual(regionalCombined.Party, appSchemaMap.Party), false);
  t.end();
});

const abstractCombined = cleanSchemas(
  getAbstractCombinedSchemas(regionalCombined)
);

test('Meta Properties', function (t) {
  t.equal(abstractCombined.Customer!.extends, undefined);
  t.end();
});

test('Abstract Schema Existance', function (t) {
  t.equal(abstractCombined.Party, undefined);
  t.end();
});

test('Field Counts', function (t) {
  t.equal(abstractCombined.Customer!.fields?.length, 11);
  t.end();
});

test('Quick Edit Field Counts', function (t) {
  t.equal(abstractCombined.Customer!.quickEditFields?.length, 8);
  t.end();
});

test('Schema Equality with App Schemas', function (t) {
  t.equal(isEqual(abstractCombined.Account, appSchemaMap.Account), true);
  t.equal(
    isEqual(abstractCombined.JournalEntry, appSchemaMap.JournalEntry),
    true
  );
  t.equal(
    isEqual(
      abstractCombined.JournalEntryAccount,
      appSchemaMap.JournalEntryAccount
    ),
    true
  );
  t.equal(isEqual(abstractCombined.Customer, appSchemaMap.Customer), false);
  t.end();
});

test('Schema Field Existance', function (t) {
  t.equal(
    everyFieldExists(
      regionalSchemaMap.Party.quickEditFields ?? [],
      abstractCombined.Customer!
    ),
    true
  );
  t.end();
});

let almostFinalSchemas = cloneDeep(abstractCombined);
almostFinalSchemas = addMetaFields(almostFinalSchemas);
const finalSchemas = setSchemaNameOnFields(almostFinalSchemas);
const metaSchemaMap = getMapFromList(metaSchemas, 'name');
const baseFieldNames = metaSchemaMap.base.fields!.map((f) => f.fieldname);
const childFieldNames = metaSchemaMap.child.fields!.map((f) => f.fieldname);
const treeFieldNames = metaSchemaMap.tree.fields!.map((f) => f.fieldname);
const submittableFieldNames = metaSchemaMap.submittable.fields!.map(
  (f) => f.fieldname
);
const allFieldNames = [
  ...baseFieldNames,
  ...childFieldNames,
  ...treeFieldNames,
  ...submittableFieldNames,
];

test('Schema Name Existsance', function (t) {
  for (const schemaName in finalSchemas) {
    for (const field of finalSchemas[schemaName]?.fields!) {
      t.equal(field.schemaName, schemaName);
    }
  }
  t.end();
});

test('Schema Field Existance', function (t) {
  t.equal(everyFieldExists(baseFieldNames, finalSchemas.Customer!), true);

  t.equal(
    someFieldExists(
      subtract(allFieldNames, baseFieldNames),
      finalSchemas.Customer!
    ),
    false
  );

  t.equal(
    everyFieldExists(
      [...baseFieldNames, ...submittableFieldNames],
      finalSchemas.JournalEntry!
    ),
    true
  );

  t.equal(
    someFieldExists(
      subtract(allFieldNames, baseFieldNames, submittableFieldNames),
      finalSchemas.JournalEntry!
    ),
    false
  );

  t.equal(
    everyFieldExists(childFieldNames, finalSchemas.JournalEntryAccount!),
    true
  );

  t.equal(
    someFieldExists(
      subtract(allFieldNames, childFieldNames),
      finalSchemas.JournalEntryAccount!
    ),
    false
  );

  t.equal(
    everyFieldExists(
      [...treeFieldNames, ...baseFieldNames],
      finalSchemas.Account!
    ),
    true
  );

  t.equal(
    someFieldExists(
      subtract(allFieldNames, treeFieldNames, baseFieldNames),
      finalSchemas.Account!
    ),
    false
  );

  t.end();
});
