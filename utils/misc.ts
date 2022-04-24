import countryInfo from 'fixtures/countryInfo.json';
import { DateTime } from 'luxon';
import { CountryInfoMap } from './types';

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

export function getFiscalYear(date: string, isStart: boolean) {
  if (!date) {
    return '';
  }

  const today = DateTime.local();
  const dateTime = DateTime.fromFormat(date, 'MM-dd');
  if (isStart) {
    return dateTime
      .plus({ year: [1, 2, 3].includes(today.month) ? -1 : 0 })
      .toISODate();
  }

  return dateTime
    .plus({ year: [1, 2, 3].includes(today.month) ? 0 : 1 })
    .toISODate();
}
