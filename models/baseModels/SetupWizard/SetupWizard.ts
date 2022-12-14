import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { FormulaMap, ListsMap, ValidationMap } from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';
import { DateTime } from 'luxon';
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
    { countryCode: 'fr', name: 'France - Plan comptable' },
    /*  
    { countryCode: 'th', name: 'Thailand - Chart of Accounts' },
    { countryCode: 'us', name: 'United States - Chart of Accounts' },
    { countryCode: 've', name: 'Venezuela - Plan de Cuentas' },
    { countryCode: 'za', name: 'South Africa - Chart of Accounts' },
    { countryCode: 'de', name: 'Germany - Kontenplan' },
    { countryCode: 'it', name: 'Italy - Piano dei Conti' },
    { countryCode: 'es', name: 'Spain - Plan de Cuentas' },
    { countryCode: 'pt', name: 'Portugal - Plan de Contas' },
    { countryCode: 'pl', name: 'Poland - Rejestr Kont' },
    { countryCode: 'ro', name: 'Romania - Contabilitate' },
    { countryCode: 'ru', name: 'Russia - Chart of Accounts' },
    { countryCode: 'se', name: 'Sweden - Kontoplan' },
    { countryCode: 'ch', name: 'Switzerland - Kontenplan' },
    { countryCode: 'tr', name: 'Turkey - Chart of Accounts' },*/
  ];
}

export class SetupWizard extends Doc {
  fiscalYearEnd?: Date;
  fiscalYearStart?: Date;

  formulas: FormulaMap = {
    fiscalYearStart: {
      formula: async (fieldname?: string) => {
        if (
          fieldname === 'fiscalYearEnd' &&
          this.fiscalYearEnd &&
          !this.fiscalYearStart
        ) {
          return DateTime.fromJSDate(this.fiscalYearEnd)
            .minus({ years: 1 })
            .plus({ days: 1 })
            .toJSDate();
        }

        if (!this.country) {
          return;
        }

        const countryInfo = getCountryInfo();
        const fyStart =
          countryInfo[this.country as string]?.fiscal_year_start ?? '';
        return getFiscalYear(fyStart, true);
      },
      dependsOn: ['country', 'fiscalYearEnd'],
    },
    fiscalYearEnd: {
      formula: async (fieldname?: string) => {
        if (
          fieldname === 'fiscalYearStart' &&
          this.fiscalYearStart &&
          !this.fiscalYearEnd
        ) {
          return DateTime.fromJSDate(this.fiscalYearStart)
            .plus({ years: 1 })
            .minus({ days: 1 })
            .toJSDate();
        }

        if (!this.country) {
          return;
        }

        const countryInfo = getCountryInfo();
        const fyEnd =
          countryInfo[this.country as string]?.fiscal_year_end ?? '';
        return getFiscalYear(fyEnd, false);
      },
      dependsOn: ['country', 'fiscalYearStart'],
    },
    currency: {
      formula: async () => {
        if (!this.country) {
          return;
        }
        const countryInfo = getCountryInfo();
        return countryInfo[this.country as string]?.currency;
      },
      dependsOn: ['country'],
    },
    chartOfAccounts: {
      formula: async () => {
        const country = this.get('country') as string | undefined;
        if (country === undefined) {
          return;
        }

        const countryInfo = getCountryInfo();
        const code = (countryInfo[country] as undefined | { code: string })
          ?.code;
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
      dependsOn: ['country'],
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
