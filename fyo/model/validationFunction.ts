import { ValidationError, ValueError } from 'fyo/utils/errors';
import { t } from 'fyo/utils/translation';
import { OptionField } from 'schemas/types';

export function email(value: string) {
  const isValid = /(.+)@(.+){2,}\.(.+){2,}/.test(value);
  if (!isValid) {
    throw new ValidationError(`Invalid email: ${value}`);
  }
}

export function phone(value: string) {
  const isValid = /[+]{0,1}[\d ]+/.test(value);
  if (!isValid) {
    throw new ValidationError(`Invalid phone: ${value}`);
  }
}

export function validateSelect(field: OptionField, value: string) {
  const options = field.options;
  if (!options) {
    return;
  }

  if (!field.required && (value === null || value === undefined)) {
    return;
  }

  const validValues = options.map((o) => o.value);

  if (validValues.includes(value)) {
    return;
  }

  const labels = options.map((o) => o.label).join(', ');
  throw new ValueError(
    t`Invalid value ${value} for ${field.label}. Must be one of ${labels}`
  );
}
