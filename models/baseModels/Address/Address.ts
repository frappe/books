import Doc from 'frappe/model/doc';
import { EmptyMessageMap, FormulaMap, ListsMap } from 'frappe/model/types';
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
    state: (doc: Doc, frappe) => {
      if (doc.country) {
        return frappe.t`Enter State`;
      }

      return frappe.t`Enter Country to load States`;
    },
  };
}
