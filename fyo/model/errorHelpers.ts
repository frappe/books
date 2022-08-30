import { Fyo } from 'fyo';
import { DuplicateEntryError, NotFoundError } from 'fyo/utils/errors';
import {
  DynamicLinkField,
  Field,
  FieldTypeEnum,
  TargetField,
} from 'schemas/types';
import { Doc } from './doc';

type NotFoundDetails = { label: string; value: string };

export async function getDbSyncError(
  err: Error,
  doc: Doc,
  fyo: Fyo
): Promise<Error> {
  if (err.message.includes('UNIQUE constraint failed:')) {
    return getDuplicateEntryError(err, doc);
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return getNotFoundError(err, doc, fyo);
  }
  return err;
}

function getDuplicateEntryError(
  err: Error,
  doc: Doc
): Error | DuplicateEntryError {
  const matches = err.message.match(/UNIQUE constraint failed:\s(\w+)\.(\w+)$/);
  if (!matches) {
    return err;
  }

  const schemaName = matches[1];
  const fieldname = matches[2];
  if (!schemaName || !fieldname) {
    return err;
  }

  const duplicateEntryError = new DuplicateEntryError(err.message, false);
  const validDict = doc.getValidDict(false, true);
  duplicateEntryError.stack = err.stack;
  duplicateEntryError.more = {
    schemaName,
    fieldname,
    value: validDict[fieldname],
  };

  return duplicateEntryError;
}

async function getNotFoundError(
  err: Error,
  doc: Doc,
  fyo: Fyo
): Promise<NotFoundError> {
  const notFoundError = new NotFoundError(fyo.t`Cannot perform operation.`);
  notFoundError.stack = err.stack;
  notFoundError.more.message = err.message;

  const details = await getNotFoundDetails(doc, fyo);
  if (!details) {
    notFoundError.shouldStore = true;
    return notFoundError;
  }

  notFoundError.shouldStore = false;
  notFoundError.message = fyo.t`${details.label} value ${details.value} does not exist.`;
  return notFoundError;
}

async function getNotFoundDetails(
  doc: Doc,
  fyo: Fyo
): Promise<NotFoundDetails | null> {
  /**
   * Since 'FOREIGN KEY constraint failed' doesn't inform
   * how the operation failed, all Link and DynamicLink fields
   * must be checked for value existance so as to provide a
   * decent error message.
   */
  for (const field of doc.schema.fields) {
    const details = await getNotFoundDetailsIfDoesNotExists(field, doc, fyo);
    if (details) {
      return details;
    }
  }

  return null;
}

async function getNotFoundDetailsIfDoesNotExists(
  field: Field,
  doc: Doc,
  fyo: Fyo
): Promise<NotFoundDetails | null> {
  const value = doc.get(field.fieldname);
  if (field.fieldtype === FieldTypeEnum.Link && value) {
    return getNotFoundLinkDetails(field as TargetField, value as string, fyo);
  }

  if (field.fieldtype === FieldTypeEnum.DynamicLink && value) {
    return getNotFoundDynamicLinkDetails(
      field as DynamicLinkField,
      value as string,
      fyo,
      doc
    );
  }

  if (
    field.fieldtype === FieldTypeEnum.Table &&
    (value as Doc[] | undefined)?.length
  ) {
    return getNotFoundTableDetails(value as Doc[], fyo);
  }

  return null;
}

async function getNotFoundLinkDetails(
  field: TargetField,
  value: string,
  fyo: Fyo
): Promise<NotFoundDetails | null> {
  const { target } = field;
  const exists = await fyo.db.exists(target as string, value);
  if (!exists) {
    return { label: field.label, value };
  }

  return null;
}

async function getNotFoundDynamicLinkDetails(
  field: DynamicLinkField,
  value: string,
  fyo: Fyo,
  doc: Doc
): Promise<NotFoundDetails | null> {
  const { references } = field;
  const target = doc.get(references);
  if (!target) {
    return null;
  }

  const exists = await fyo.db.exists(target as string, value);
  if (!exists) {
    return { label: field.label, value };
  }

  return null;
}

async function getNotFoundTableDetails(
  value: Doc[],
  fyo: Fyo
): Promise<NotFoundDetails | null> {
  for (const childDoc of value) {
    const details = getNotFoundDetails(childDoc, fyo);
    if (details) {
      return details;
    }
  }

  return null;
}
