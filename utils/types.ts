export type UnknownMap = Record<string, unknown>;
export type Translation = { translation: string; context?: string };
export type LanguageMap = Record<string, Translation>;

export type CountryInfoMap = Record<string, CountryInfo | undefined>;
export interface CountryInfo {
  code: string;
  currency: string;
  currency_fraction?: string;
  currency_fraction_units?: number;
  smallest_currency_fraction_value?: number;
  currency_symbol?: string;
  timezones?: string[];
  fiscal_year_start: string;
  fiscal_year_end: string;
  locale: string;
}

export interface VersionParts {
  major: number;
  minor: number;
  patch: number;
  beta?: number;
}

export type Creds = {
  errorLogUrl: string;
  telemetryUrl: string;
  tokenString: string;
};

export type UnexpectedLogObject = {
  name: string;
  message: string;
  stack: string;
  more: Record<string, unknown>;
};

export interface SelectFileOptions {
  title: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface SelectFileReturn {
  name: string;
  filePath: string;
  success: boolean;
  data: Buffer;
  canceled: boolean;
}

export type PropertyEnum<T extends Record<string, any>> = {
  [key in keyof Required<T>]: key;
};

export type TemplateFile = { file: string; template: string; modified: string };
