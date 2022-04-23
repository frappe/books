import countryInfo from 'fixtures/countryInfo.json';
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
