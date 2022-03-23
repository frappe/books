import { cloneDeep } from 'lodash';
import { getListFromMap, getMapFromList } from './helpers';
import regionalSchemas from './regional';
import { appSchemas, coreSchemas, metaSchemas } from './schemas';
import { Schema, SchemaMap, SchemaStub, SchemaStubMap } from './types';

export function getSchemas(countryCode: string = '-'): SchemaMap {
  const builtCoreSchemas = getCoreSchemas();
  const builtAppSchemas = getAppSchemas(countryCode);

  let schemaMap = Object.assign({}, builtAppSchemas, builtCoreSchemas);
  schemaMap = addMetaFields(schemaMap);
  return schemaMap;
}

function addMetaFields(schemaMap: SchemaMap): SchemaMap {
  const metaSchemaMap = getMapFromList(metaSchemas);

  const base = metaSchemaMap.base;
  const tree = getCombined(metaSchemaMap.tree, base);
  const child = metaSchemaMap.child;
  const submittable = getCombined(metaSchemaMap.submittable, base);
  const submittableTree = getCombined(tree, metaSchemaMap.submittable);

  for (const name in schemaMap) {
    const schema = schemaMap[name];
    if (schema.isSingle) {
      continue;
    }

    if (schema.isTree && schema.isSubmittable) {
      schema.fields = [...schema.fields, ...submittableTree.fields];
    } else if (schema.isTree) {
      schema.fields = [...schema.fields, ...tree.fields];
    } else if (schema.isSubmittable) {
      schema.fields = [...schema.fields, ...submittable.fields];
    } else if (schema.isChild) {
      schema.fields = [...schema.fields, ...child.fields];
    } else {
      schema.fields = [...schema.fields, ...base.fields];
    }
  }

  return schemaMap;
}

function getCoreSchemas(): SchemaMap {
  const rawSchemaMap = getMapFromList(coreSchemas);
  const coreSchemaMap = getAbstractCombinedSchemas(rawSchemaMap);
  return cleanSchemas(coreSchemaMap);
}

function getAppSchemas(countryCode: string): SchemaMap {
  const combinedSchemas = getRegionalCombinedSchemas(countryCode);
  const schemaMap = getAbstractCombinedSchemas(combinedSchemas);
  return cleanSchemas(schemaMap);
}

function cleanSchemas(schemaMap: SchemaMap): SchemaMap {
  for (const name in schemaMap) {
    const schema = schemaMap[name];
    if (schema.isAbstract && !schema.extends) {
      delete schemaMap[name];
      continue;
    }

    delete schema.extends;
    delete schema.isAbstract;
  }

  return schemaMap;
}

function getCombined(
  extendingSchema: SchemaStub,
  abstractSchema: SchemaStub
): SchemaStub {
  abstractSchema = cloneDeep(abstractSchema);
  extendingSchema = cloneDeep(extendingSchema);

  const abstractFields = getMapFromList(
    abstractSchema.fields ?? [],
    'fieldname'
  );
  const extendingFields = getMapFromList(
    extendingSchema.fields ?? [],
    'fieldname'
  );

  const combined = Object.assign(abstractSchema, extendingSchema);

  for (const fieldname in extendingFields) {
    abstractFields[fieldname] = extendingFields[fieldname];
  }

  combined.fields = getListFromMap(abstractFields);
  return combined;
}

function getAbstractCombinedSchemas(schemas: SchemaStubMap): SchemaMap {
  const abstractSchemaNames: string[] = Object.keys(schemas).filter(
    (n) => schemas[n].isAbstract
  );

  const extendingSchemaNames: string[] = Object.keys(schemas).filter((n) =>
    abstractSchemaNames.includes(schemas[n].extends)
  );

  const completeSchemas: Schema[] = Object.keys(schemas)
    .filter(
      (n) =>
        !abstractSchemaNames.includes(n) && !extendingSchemaNames.includes(n)
    )
    .map((n) => schemas[n] as Schema);

  const schemaMap = getMapFromList(completeSchemas) as SchemaMap;

  for (const name of extendingSchemaNames) {
    const extendingSchema = schemas[name] as Schema;
    const abstractSchema = schemas[extendingSchema.extends] as SchemaStub;

    schemaMap[name] = getCombined(extendingSchema, abstractSchema) as Schema;
  }

  for (const name in abstractSchemaNames) {
    delete schemaMap[name];
  }

  return schemaMap;
}

function getRegionalCombinedSchemas(countryCode: string): SchemaStubMap {
  const regionalSchemaMap = getRegionalSchema(countryCode);
  const appSchemaMap = getMapFromList(appSchemas);
  const combined = { ...appSchemaMap };

  for (const name in regionalSchemaMap) {
    const regionalSchema = regionalSchemaMap[name];

    if (!combined.hasOwnProperty(name)) {
      combined[name] = regionalSchema;
      continue;
    }

    combined[name] = getCombined(regionalSchema, combined[name]);
  }

  return combined;
}

function getRegionalSchema(countryCode: string): SchemaStubMap {
  const countrySchemas = regionalSchemas[countryCode] as
    | SchemaStub[]
    | undefined;
  if (countrySchemas === undefined) {
    return {};
  }

  return getMapFromList(countrySchemas);
}
