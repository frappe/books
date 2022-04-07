import * as assert from 'assert';
import { cloneDeep, isEqual } from 'lodash';
import { describe } from 'mocha';
import { getMapFromList } from 'utils';
import {
  addMetaFields,
  cleanSchemas,
  getAbstractCombinedSchemas,
  getRegionalCombinedSchemas,
} from '../index';
import { metaSchemas } from '../schemas';
import {
  everyFieldExists,
  getTestSchemaMap,
  someFieldExists,
  subtract,
} from './helpers';

describe('Schema Builder', function () {
  const { appSchemaMap, regionalSchemaMap } = getTestSchemaMap();
  describe('Raw Schemas', function () {
    specify('Meta Properties', function () {
      assert.strictEqual(appSchemaMap.Party.isAbstract, true);
      assert.strictEqual(appSchemaMap.Customer.extends, 'Party');
      assert.strictEqual(appSchemaMap.Account.isTree, true);
      assert.strictEqual(appSchemaMap.JournalEntryAccount.isChild, true);
    });

    specify('Field Counts', function () {
      assert.strictEqual(appSchemaMap.Account.fields?.length, 6);
      assert.strictEqual(appSchemaMap.JournalEntry.fields?.length, 8);
      assert.strictEqual(appSchemaMap.JournalEntryAccount.fields?.length, 3);
      assert.strictEqual(appSchemaMap.Party.fields?.length, 8);
      assert.strictEqual(appSchemaMap.Customer.fields?.length, undefined);
      assert.strictEqual(regionalSchemaMap.Party.fields?.length, 2);
    });

    specify('Quick Edit Field Counts', function () {
      assert.strictEqual(appSchemaMap.Party.quickEditFields?.length, 5);
      assert.strictEqual(regionalSchemaMap.Party.quickEditFields?.length, 7);
    });
  });

  const regionalCombined = getRegionalCombinedSchemas(
    appSchemaMap,
    regionalSchemaMap
  );
  describe('Regional Combined Schemas', function () {
    specify('Field Counts', function () {
      assert.strictEqual(regionalCombined.Party.fields?.length, 10);
    });

    specify('Quick Edit Field Counts', function () {
      assert.strictEqual(regionalSchemaMap.Party.quickEditFields?.length, 7);
    });

    specify('Schema Equality with App Schemas', function () {
      assert.strictEqual(
        isEqual(regionalCombined.Account, appSchemaMap.Account),
        true
      );
      assert.strictEqual(
        isEqual(regionalCombined.JournalEntry, appSchemaMap.JournalEntry),
        true
      );
      assert.strictEqual(
        isEqual(
          regionalCombined.JournalEntryAccount,
          appSchemaMap.JournalEntryAccount
        ),
        true
      );
      assert.strictEqual(
        isEqual(regionalCombined.Customer, appSchemaMap.Customer),
        true
      );
      assert.strictEqual(
        isEqual(regionalCombined.Party, appSchemaMap.Party),
        false
      );
    });
  });

  const abstractCombined = cleanSchemas(
    getAbstractCombinedSchemas(regionalCombined)
  );
  describe('Abstract Combined Schemas', function () {
    specify('Meta Properties', function () {
      assert.strictEqual(abstractCombined.Customer!.extends, undefined);
    });

    specify('Abstract Schema Existance', function () {
      assert.strictEqual(abstractCombined.Party, undefined);
    });

    specify('Field Counts', function () {
      assert.strictEqual(abstractCombined.Customer!.fields?.length, 10);
    });

    specify('Quick Edit Field Counts', function () {
      assert.strictEqual(abstractCombined.Customer!.quickEditFields?.length, 7);
    });

    specify('Schema Equality with App Schemas', function () {
      assert.strictEqual(
        isEqual(abstractCombined.Account, appSchemaMap.Account),
        true
      );
      assert.strictEqual(
        isEqual(abstractCombined.JournalEntry, appSchemaMap.JournalEntry),
        true
      );
      assert.strictEqual(
        isEqual(
          abstractCombined.JournalEntryAccount,
          appSchemaMap.JournalEntryAccount
        ),
        true
      );
      assert.strictEqual(
        isEqual(abstractCombined.Customer, appSchemaMap.Customer),
        false
      );
    });

    specify('Schema Field Existance', function () {
      assert.strictEqual(
        everyFieldExists(
          regionalSchemaMap.Party.quickEditFields ?? [],
          abstractCombined.Customer!
        ),
        true
      );
    });
  });

  const finalSchemas = addMetaFields(cloneDeep(abstractCombined));
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

  describe('Final Schemas', function () {
    specify('Schema Field Existance', function () {
      assert.strictEqual(
        everyFieldExists(baseFieldNames, finalSchemas.Customer!),
        true
      );

      assert.strictEqual(
        someFieldExists(
          subtract(allFieldNames, baseFieldNames),
          finalSchemas.Customer!
        ),
        false
      );

      assert.strictEqual(
        everyFieldExists(
          [...baseFieldNames, ...submittableFieldNames],
          finalSchemas.JournalEntry!
        ),
        true
      );

      assert.strictEqual(
        someFieldExists(
          subtract(allFieldNames, baseFieldNames, submittableFieldNames),
          finalSchemas.JournalEntry!
        ),
        false
      );

      assert.strictEqual(
        everyFieldExists(childFieldNames, finalSchemas.JournalEntryAccount!),
        true
      );

      assert.strictEqual(
        someFieldExists(
          subtract(allFieldNames, childFieldNames),
          finalSchemas.JournalEntryAccount!
        ),
        false
      );

      assert.strictEqual(
        everyFieldExists(
          [...treeFieldNames, ...baseFieldNames],
          finalSchemas.Account!
        ),
        true
      );

      assert.strictEqual(
        someFieldExists(
          subtract(allFieldNames, treeFieldNames, baseFieldNames),
          finalSchemas.Account!
        ),
        false
      );
    });
  });
});
