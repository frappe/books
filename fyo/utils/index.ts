import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action, DocStatus } from 'fyo/model/types';
import { Money } from 'pesa';
import { Field, OptionField, SelectOption } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';

export function slug(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function unique<T>(list: T[], key = (it: T) => String(it)) {
  const seen: Record<string, boolean> = {};
  return list.filter((item) => {
    const k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}

export function getDuplicates(array: unknown[]) {
  const duplicates: unknown[] = [];
  for (const i in array) {
    const previous = array[parseInt(i) - 1];
    const current = array[i];

    if (current === previous) {
      if (!duplicates.includes(current)) {
        duplicates.push(current);
      }
    }
  }
  return duplicates;
}

export function isPesa(value: unknown): boolean {
  return value instanceof Money;
}

export function getActions(doc: Doc): Action[] {
  const Model = doc.fyo.models[doc.schemaName];
  if (Model === undefined) {
    return [];
  }

  return Model.getActions(doc.fyo);
}

export async function getSingleValue(
  fieldname: string,
  parent: string,
  fyo: Fyo
) {
  if (!fyo.db.isConnected) {
    return undefined;
  }

  const res = await fyo.db.getSingleValues({ fieldname, parent });
  const singleValue = res.find(
    (f) => f.fieldname === fieldname && f.parent === parent
  );

  if (singleValue === undefined) {
    return undefined;
  }

  return singleValue.value;
}

export function getOptionList(
  field: Field,
  doc: Doc | undefined | null
): SelectOption[] {
  const list = getRawOptionList(field, doc);
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

function getRawOptionList(field: Field, doc: Doc | undefined | null) {
  const options = (field as OptionField).options;
  if (options && options.length > 0) {
    return (field as OptionField).options;
  }

  if (getIsNullOrUndef(doc)) {
    return [];
  }

  const Model = doc!.fyo.models[doc!.schemaName];
  if (Model === undefined) {
    return [];
  }

  const getList = Model.lists[field.fieldname];
  if (getList === undefined) {
    return [];
  }

  return getList(doc!);
}
