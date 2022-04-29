import { FormulaMap, ListsMap } from 'fyo/model/types';
import { Address as BaseAddress } from 'models/baseModels/Address/Address';
import { stateCodeMap } from 'regional/in';
import { titleCase } from 'utils';

export class Address extends BaseAddress {
  formulas: FormulaMap = {
    addressDisplay: {
      formula: async () => {
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
      formula: async () => {
        const stateList = Object.keys(stateCodeMap).map(titleCase).sort();
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
      return Object.keys(stateCodeMap).map(titleCase).sort();
    },
  };
}
