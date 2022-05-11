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
    return (doc.name = await getNextId(doc.schemaName, fyo));
  }

  if (doc.numberSeries !== undefined) {
    return (doc.name = await getSeriesNext(
      doc.numberSeries as string,
      doc.schemaName,
      fyo
    ));
  }

  // name === schemaName for Single
  if (doc.schema.isSingle) {
    return (doc.name = doc.schemaName);
  }

  // Assign a random name by default
  if (!doc.name) {
    doc.name = getRandomString();
  }

  return doc.name;
}

export async function getNextId(schemaName: string, fyo: Fyo): Promise<string> {
  const lastInserted = await fyo.db.getLastInserted(schemaName);
  return String(lastInserted + 1).padStart(9, '0');
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
