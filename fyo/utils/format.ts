import { Fyo } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { DateTime } from 'luxon';
import { Money } from 'pesa';
import { Field, FieldType, FieldTypeEnum } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import {
  DEFAULT_CURRENCY,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_LOCALE,
} from './consts';

export function format(
  value: DocValue,
  df: string | Field | null,
  doc: Doc | null,
  fyo: Fyo
): string {
  if (!df) {
    return String(value);
  }

  const field: Field = getField(df);

  if (field.fieldtype === FieldTypeEnum.Currency) {
    return formatCurrency(value, field, doc, fyo);
  }

  if (field.fieldtype === FieldTypeEnum.Date) {
    return formatDate(value, fyo);
  }

  if (field.fieldtype === FieldTypeEnum.Check) {
    return Boolean(value).toString();
  }

  if (getIsNullOrUndef(value)) {
    return '';
  }

  return String(value);
}

function formatDate(value: DocValue, fyo: Fyo): string {
  const dateFormat =
    (fyo.singles.SystemSettings?.dateFormat as string) ?? DEFAULT_DATE_FORMAT;

  let dateValue: DateTime;
  if (typeof value === 'string') {
    dateValue = DateTime.fromISO(value);
  } else if (value instanceof Date) {
    dateValue = DateTime.fromJSDate(value);
  } else {
    dateValue = DateTime.fromSeconds(value as number);
  }

  const formattedDate = dateValue.toFormat(dateFormat);
  if (value === 'Invalid DateTime') {
    return '';
  }

  return formattedDate;
}

function formatCurrency(
  value: DocValue,
  field: Field,
  doc: Doc | null,
  fyo: Fyo
): string {
  const currency = getCurrency(value as Money, field, doc, fyo);

  let valueString;
  try {
    valueString = formatNumber(value, fyo);
  } catch (err) {
    (err as Error).message += ` value: '${value}', type: ${typeof value}`;
    throw err;
  }

  const currencySymbol = fyo.currencySymbols[currency];
  if (currencySymbol !== undefined) {
    return currencySymbol + ' ' + valueString;
  }

  return valueString;
}

function formatNumber(value: DocValue, fyo: Fyo): string {
  const numberFormatter = getNumberFormatter(fyo);
  if (typeof value === 'number') {
    value = fyo.pesa(value.toFixed(20));
  }

  if ((value as Money).round) {
    const floatValue = parseFloat((value as Money).round());
    return numberFormatter.format(floatValue);
  }

  const floatValue = parseFloat(value as string);
  const formattedNumber = numberFormatter.format(floatValue);

  if (formattedNumber === 'NaN') {
    throw Error(
      `invalid value passed to formatNumber: '${value}' of type ${typeof value}`
    );
  }

  return formattedNumber;
}

function getNumberFormatter(fyo: Fyo) {
  if (fyo.currencyFormatter) {
    return fyo.currencyFormatter;
  }

  const locale =
    (fyo.singles.SystemSettings?.locale as string) ?? DEFAULT_LOCALE;
  const display =
    (fyo.singles.SystemSettings?.displayPrecision as number) ??
    DEFAULT_DISPLAY_PRECISION;

  return (fyo.currencyFormatter = Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: display,
  }));
}

function getCurrency(
  value: Money,
  field: Field,
  doc: Doc | null,
  fyo: Fyo
): string {
  const currency = value?.getCurrency?.();
  const defaultCurrency =
    fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY;

  if (currency && currency !== defaultCurrency) {
    return currency;
  }

  let getCurrency = doc?.getCurrencies?.[field.fieldname];
  if (getCurrency !== undefined) {
    return getCurrency();
  }

  getCurrency = doc?.parentdoc?.getCurrencies[field.fieldname];
  if (getCurrency !== undefined) {
    return getCurrency();
  }

  return defaultCurrency;
}

function getField(df: string | Field): Field {
  if (typeof df === 'string') {
    return {
      label: '',
      fieldname: '',
      fieldtype: df as FieldType,
    };
  }

  return df;
}
