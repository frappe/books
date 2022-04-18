import { t } from 'frappe';
import Doc from 'frappe/model/doc';
import { FormulaMap, ListsMap } from 'frappe/model/types';
import { DateTime } from 'luxon';
import countryInfo from '../../../fixtures/countryInfo.json';

export function getCOAList() {
  return [
    { name: t`Standard Chart of Accounts`, countryCode: '' },

    { countryCode: 'ae', name: 'U.A.E - Chart of Accounts' },
    {
      countryCode: 'ca',
      name: 'Canada - Plan comptable pour les provinces francophones',
    },
    { countryCode: 'gt', name: 'Guatemala - Cuentas' },
    { countryCode: 'hu', name: 'Hungary - Chart of Accounts' },
    { countryCode: 'id', name: 'Indonesia - Chart of Accounts' },
    { countryCode: 'in', name: 'India - Chart of Accounts' },
    { countryCode: 'mx', name: 'Mexico - Plan de Cuentas' },
    { countryCode: 'ni', name: 'Nicaragua - Catalogo de Cuentas' },
    { countryCode: 'nl', name: 'Netherlands - Grootboekschema' },
    { countryCode: 'sg', name: 'Singapore - Chart of Accounts' },
  ];
}

export class SetupWizard extends Doc {
  formulas: FormulaMap = {
    fiscalYearStart: async () => {
      if (!this.country) return;

      const today = DateTime.local();

      // @ts-ignore
      const fyStart = countryInfo[this.country].fiscal_year_start as
        | string
        | undefined;

      if (fyStart) {
        return DateTime.fromFormat(fyStart, 'MM-dd')
          .plus({ year: [1, 2, 3].includes(today.month) ? -1 : 0 })
          .toISODate();
      }
    },
    fiscalYearEnd: async () => {
      if (!this.country) {
        return;
      }

      const today = DateTime.local();

      // @ts-ignore
      const fyEnd = countryInfo[this.country].fiscal_year_end as
        | string
        | undefined;
      if (fyEnd) {
        return DateTime.fromFormat(fyEnd, 'MM-dd')
          .plus({ year: [1, 2, 3].includes(today.month) ? 0 : 1 })
          .toISODate();
      }
    },
    currency: async () => {
      if (!this.country) {
        return;
      }
      // @ts-ignore
      return countryInfo[this.country].currency;
    },
    chartOfAccounts: async () => {
      const country = this.get('country') as string | undefined;
      if (country === undefined) {
        return;
      }

      // @ts-ignore
      const code = (countryInfo[country] as undefined | { code: string })?.code;
      if (code === undefined) {
        return;
      }

      const coaList = getCOAList();
      const coa = coaList.find(({ countryCode }) => countryCode === code);

      if (coa === undefined) {
        return coaList[0].name;
      }
      return coa.name;
    },
  };

  static lists: ListsMap = {
    country: () => Object.keys(countryInfo),
    chartOfAccounts: () => getCOAList().map(({ name }) => name),
  };
}
