import { Fyo } from 'fyo';
import NumberSeries from 'fyo/models/NumberSeries';
import { DEFAULT_SERIES_START } from 'fyo/utils/consts';
import { BaseError } from 'fyo/utils/errors';
import { getRandomString } from 'utils';
import { Doc } from './doc';

export function isNameAutoSet(schemaName: string, fyo: Fyo): boolean {
  const schema = fyo.schemaMap[schemaName]!;
  if (schema.naming === 'manual') {
    return false;
  }

  if (schema.naming === 'autoincrement') {
    return true;
  }

  if (schema.naming === 'random') {
    return true;
  }

  const numberSeries = fyo.getField(schema.name, 'numberSeries');
  if (numberSeries) {
    return true;
  }

  return false;
}

export async function setName(doc: Doc, fyo: Fyo) {
  if (doc.schema.naming === 'manual') {
    return;
  }

  if (doc.schema.naming === 'autoincrement') {
    doc.name = await getNextId(doc.schemaName, fyo);
    return;
  }

  // Current, per doc number series
  const numberSeries = doc.numberSeries as string | undefined;
  if (numberSeries !== undefined) {
    doc.name = await getSeriesNext(numberSeries, doc.schemaName, fyo);
    return;
  }

  if (doc.name) {
    return;
  }

  // name === schemaName for Single
  if (doc.schema.isSingle) {
    doc.name = doc.schemaName;
    return;
  }

  // assign a random name by default
  // override doc to set a name
  if (!doc.name) {
    doc.name = getRandomString();
  }
}

export async function getNextId(schemaName: string, fyo: Fyo) {
  // get the last inserted row
  const lastInserted = await getLastInserted(schemaName, fyo);
  let name = 1;
  if (lastInserted) {
    let lastNumber = parseInt(lastInserted.name as string);
    if (isNaN(lastNumber)) lastNumber = 0;
    name = lastNumber + 1;
  }
  return (name + '').padStart(9, '0');
}

export async function getLastInserted(schemaName: string, fyo: Fyo) {
  const lastInserted = await fyo.db.getAll(schemaName, {
    fields: ['name'],
    limit: 1,
    orderBy: 'created',
    order: 'desc',
  });
  return lastInserted && lastInserted.length ? lastInserted[0] : null;
}

export async function getSeriesNext(
  prefix: string,
  schemaName: string,
  fyo: Fyo
) {
  let series: NumberSeries;

  try {
    series = (await fyo.doc.getDoc('NumberSeries', prefix)) as NumberSeries;
  } catch (e) {
    const { statusCode } = e as BaseError;
    if (!statusCode || statusCode !== 404) {
      throw e;
    }

    await createNumberSeries(prefix, schemaName, DEFAULT_SERIES_START, fyo);
    series = (await fyo.doc.getDoc('NumberSeries', prefix)) as NumberSeries;
  }

  return await series.next(schemaName);
}

export async function createNumberSeries(
  prefix: string,
  referenceType: string,
  start: number,
  fyo: Fyo
) {
  const exists = await fyo.db.exists('NumberSeries', prefix);
  if (exists) {
    return;
  }

  const series = fyo.doc.getNewDoc('NumberSeries', {
    name: prefix,
    start,
    referenceType,
  });

  await series.sync();
}
