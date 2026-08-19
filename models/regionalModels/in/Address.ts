import { FormulaMap, ListsMap } from 'fyo/model/types';
import { Address as BaseAddress } from 'models/baseModels/Address/Address';
import { codeStateMap } from 'regional/in';

export class Address extends BaseAddress {
  formulas: FormulaMap = {
    addressDisplay: {
      formula: () => {
        return [
          this.addressLine1,
          this.addressLine2,
          this.city,
          this.state,
          this.country,
          this.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
      },
      dependsOn: [
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'country',
        'postalCode',
      ],
    },

    pos: {
      formula: () => {
        const stateList = Object.values(codeStateMap).sort();
        const state = this.state as string;
        if (stateList.includes(state)) {
          return state;
        }
        return '';
      },
      dependsOn: ['state'],
    },
  };

  static lists: ListsMap = {
    ...BaseAddress.lists,
    pos: () => {
      return Object.values(codeStateMap).sort();
    },
  };
}
