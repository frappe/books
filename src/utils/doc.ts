import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';

export function evaluateReadOnly(field: Field, doc: Doc) {
  if (field.readOnly !== undefined) {
    return field.readOnly;
  }

  if (field.fieldname === 'numberSeries' && !doc.notInserted) {
    return true;
  }

  if (doc.isSubmitted || doc.parentdoc?.isSubmitted) {
    return true;
  }

  if (doc.isCancelled || doc.parentdoc?.isCancelled) {
    return true;
  }

  const readOnlyFunc = doc.readOnly[field.fieldname];
  if (readOnlyFunc !== undefined) {
    return readOnlyFunc();
  }

  return false;
}

export function evaluateHidden(field: Field, doc: Doc) {
  if (field.hidden !== undefined) {
    return field.hidden;
  }

  const hiddenFunction = doc.hidden[field.fieldname];
  if (hiddenFunction !== undefined) {
    return hiddenFunction();
  }

  return false;
}
