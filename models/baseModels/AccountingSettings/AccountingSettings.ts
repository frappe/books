import Doc from 'fyo/model/doc';
import { FiltersMap, ListsMap } from 'fyo/model/types';
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

  static lists: ListsMap = {
    country: () => Object.keys(countryInfo),
  };
}
