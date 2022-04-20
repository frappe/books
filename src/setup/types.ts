export interface SetupWizardOptions {
  companyLogo: string;
  companyName: string;
  country: string;
  fullname: string;
  name: string;
  email: string;
  bankName: string;
  currency: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  chartOfAccounts: string;
}

export interface CountrySettings {
  code: string;
  currency: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  locale: string;
  currency_fraction?: string;
  currency_fraction_units?: number;
  smallest_currency_fraction_value?: number;
  currency_symbol?: string;
}