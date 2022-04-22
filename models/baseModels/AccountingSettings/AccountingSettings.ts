import Doc from 'fyo/model/doc';
import { FiltersMap, ListsMap, ValidationMap } from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';
import countryInfo from '../../../fixtures/countryInfo.json';

export class AccountingSettings extends Doc {
  static filters: FiltersMap = {
    writeOffAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
    roundOffAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
  };

  validations: ValidationMap = {
    email: validateEmail,
  };

  static lists: ListsMap = {
    country: () => Object.keys(countryInfo),
  };
}