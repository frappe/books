import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { EmptyMessageMap, FormulaMap, ListsMap } from 'fyo/model/types';
import { stateCodeMap } from 'regional/in';
import { titleCase } from 'utils';
import { getCountryInfo } from 'utils/misc';

export class Address extends Doc {
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
  };

  static lists: ListsMap = {
    state(doc?: Doc) {
      const country = doc?.country as string | undefined;
      switch (country) {
        case 'India':
          return Object.keys(stateCodeMap).map(titleCase).sort();
        default:
          return [] as string[];
      }
    },
    country() {
      return Object.keys(getCountryInfo()).sort();
    },
  };

  static emptyMessages: EmptyMessageMap = {
    state: (doc: Doc) => {
      if (doc.country) {
        return t`Enter State`;
      }

      return t`Enter Country to load States`;
    },
  };
}
