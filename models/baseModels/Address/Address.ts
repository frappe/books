import { Fyo } from 'fyo';
import Doc from 'fyo/model/doc';
import { EmptyMessageMap, FormulaMap, ListsMap } from 'fyo/model/types';
import { stateCodeMap } from 'regional/in';
import { titleCase } from 'utils';
import countryInfo from '../../../fixtures/countryInfo.json';

export class Address extends Doc {
  formulas: FormulaMap = {
    addressDisplay: async () => {
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
      return Object.keys(countryInfo).sort();
    },
  };

  static emptyMessages: EmptyMessageMap = {
    state: (doc: Doc, fyo: Fyo) => {
      if (doc.country) {
        return fyo.t`Enter State`;
      }

      return fyo.t`Enter Country to load States`;
    },
  };
}
