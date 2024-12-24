import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ListsMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { t } from 'fyo/utils/translation';
import { SelectOption } from 'schemas/types';
import { getCountryInfo } from 'utils/misc';

export default class SystemSettings extends Doc {
  dateFormat?: string;
  locale?: string;
  displayPrecision?: number;
  internalPrecision?: number;
  hideGetStarted?: boolean;
  countryCode?: string;
  currency?: string;
  version?: string;
  instanceId?: string;
  darkMode?: boolean;

  validations: ValidationMap = {
    displayPrecision(value: DocValue) {
      if ((value as number) >= 0 && (value as number) <= 9) {
        return;
      }

      throw new ValidationError(
        t`Display Precision should have a value between 0 and 9.`
      );
    },
  };

  static lists: ListsMap = {
    locale() {
      const countryInfo = getCountryInfo();
      return Object.keys(countryInfo)
        .filter((c) => !!countryInfo[c]?.locale)
        .map(
          (c) =>
            ({
              value: countryInfo[c]?.locale,
              label: `${c} (${countryInfo[c]?.locale ?? t`Not Found`})`,
            } as SelectOption)
        );
    },
    currency() {
      const countryInfo = getCountryInfo();
      const currencies = Object.values(countryInfo)
        .map((ci) => ci?.currency as string)
        .filter(Boolean);
      return [...new Set(currencies)];
    },
  };
}
