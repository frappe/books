import { Doc } from 'fyo/model/doc';
import { Field, OptionField, SelectOption } from 'schemas/types';
import { fyo } from 'src/initFyo';

export function evaluateReadOnly(field: Field, doc: Doc) {
  if (field.readOnly !== undefined) {
    return field.readOnly;
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

export function getOptionList(field: Field, doc: Doc): SelectOption[] {
  const list = _getOptionList(field, doc);
  return list.map((option) => {
    if (typeof option === 'string') {
      return {
        label: option,
        value: option,
      };
    }

    return option;
  });
}

function _getOptionList(field: Field, doc: Doc) {
  if ((field as OptionField).options) {
    return (field as OptionField).options;
  }

  const Model = fyo.models[doc.schemaName];
  if (Model === undefined) {
    return [];
  }

  const getList = Model.lists[field.fieldname];
  if (getList === undefined) {
    return [];
  }

  return getList(doc);
}
