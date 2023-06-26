import { DocValue } from 'fyo/core/types';
import { getOptionList } from 'fyo/utils';
import { ValidationError, ValueError } from 'fyo/utils/errors';
import { t } from 'fyo/utils/translation';
import { Field, OptionField } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import { Doc } from './doc';

export function validateEmail(value: DocValue) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `Invalid email ${String(value)} of type ${typeof value}`
    );
  }

  const isValid = /(.+)@(.+){2,}\.(.+){2,}/.test(value);
  if (!isValid) {
    throw new ValidationError(`Invalid email: ${value}`);
  }
}

export function validatePhoneNumber(value: DocValue) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `Invalid phone ${String(value)} of type ${typeof value}`
    );
  }

  const isValid = /[+]{0,1}[\d ]+/.test(value);
  if (!isValid) {
    throw new ValidationError(`Invalid phone: ${value}`);
  }
}

export function validateOptions(field: OptionField, value: string, doc: Doc) {
  const options = getOptionList(field, doc);
  if (!options.length) {
    return;
  }

  if (!field.required && !value) {
    return;
  }

  const validValues = options.map((o) => o.value);

  if (validValues.includes(value) || field.allowCustom) {
    return;
  }

  throw new ValueError(t`Invalid value ${value} for ${field.label}`);
}

export function validateRequired(field: Field, value: DocValue, doc: Doc) {
  if (!getIsNullOrUndef(value)) {
    return;
  }

  if (field.required) {
    throw new ValidationError(`${field.label} is required`);
  }

  const requiredFunction = doc.required[field.fieldname];
  if (requiredFunction && requiredFunction()) {
    throw new ValidationError(`${field.label} is required`);
  }
}
