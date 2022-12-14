import { DateTime } from 'luxon';
import countryInfo from '../fixtures/countryInfo.json';
import { CUSTOM_EVENTS } from './messages';
import { CountryInfoMap, UnexpectedLogObject } from './types';

export function getCountryInfo(): CountryInfoMap {
  // @ts-ignore
  return countryInfo as CountryInfoMap;
}

export function getCountryCodeFromCountry(countryName: string): string {
  const countryInfoMap = getCountryInfo();
  const countryInfo = countryInfoMap[countryName];
  if (countryInfo === undefined) {
    return '';
  }

  return countryInfo.code;
}

export function getFiscalYear(
  date: string,
  isStart: boolean
): undefined | Date {
  if (!date) {
    return undefined;
  }

  const today = DateTime.local();
  const dateTime = DateTime.fromFormat(date, 'MM-dd');
  if (isStart) {
    return dateTime
      .plus({ year: [1, 2, 3].includes(today.month) ? -1 : 0 })
      .toJSDate();
  }

  return dateTime
    .plus({ year: [1, 2, 3].includes(today.month) ? 0 : 1 })
    .toJSDate();
}

export function logUnexpected(detail: Partial<UnexpectedLogObject>) {
  /**
   * Raises a custom event, it's lsitener is in renderer.ts
   * used to log unexpected occurances as errors.
   */
  if (!window?.CustomEvent) {
    return;
  }

  detail.name ??= 'LogUnexpected';
  detail.message ??= 'Logging an unexpected occurance';
  detail.stack ??= new Error().stack;
  detail.more ??= {};

  const event = new window.CustomEvent(CUSTOM_EVENTS.LOG_UNEXPECTED, {
    detail,
  });
  window.dispatchEvent(event);
}
