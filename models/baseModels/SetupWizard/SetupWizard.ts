import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  DependsOnMap,
  FormulaMap,
  ListsMap,
  ValidationMap,
} from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';
import { getCountryInfo, getFiscalYear } from 'utils/misc';

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
  dependsOn: DependsOnMap = {
    fiscalYearStart: ['country'],
    fiscalYearEnd: ['country'],
    currency: ['country'],
    chartOfAccounts: ['country'],
  };

  formulas: FormulaMap = {
    fiscalYearStart: async () => {
      if (!this.country) return;

      const countryInfo = getCountryInfo();
      const fyStart =
        countryInfo[this.country as string]?.fiscal_year_start ?? '';
      return getFiscalYear(fyStart, true);
    },
    fiscalYearEnd: async () => {
      if (!this.country) {
        return;
      }

      const countryInfo = getCountryInfo();
      const fyEnd = countryInfo[this.country as string]?.fiscal_year_end ?? '';
      return getFiscalYear(fyEnd, false);
    },
    currency: async () => {
      if (!this.country) {
        return;
      }
      const countryInfo = getCountryInfo();
      return countryInfo[this.country as string]?.currency;
    },
    chartOfAccounts: async () => {
      const country = this.get('country') as string | undefined;
      if (country === undefined) {
        return;
      }

      const countryInfo = getCountryInfo();
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

  validations: ValidationMap = {
    email: validateEmail,
  };

  static lists: ListsMap = {
    country: () => Object.keys(getCountryInfo()),
    chartOfAccounts: () => getCOAList().map(({ name }) => name),
  };
}
