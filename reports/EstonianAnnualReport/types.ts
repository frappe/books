export type ContextKind = 'instant_end' | 'duration_year';

export interface XbrlFact {

element: string;

value: number;
  context: ContextKind;
}

export interface XbrlNote {

element: string;
  text: string;
  context: ContextKind;
}

export interface XbrlReportData {

registryCode: string;

periodStart: string;

periodEnd: string;

year: number;

generalInfo: XbrlFact[];

balanceSheet: XbrlFact[];

incomeStatement: XbrlFact[];

notes: XbrlNote[];
}

export interface AccountMapping {
  balanceSheet: Record<string, { accounts: string[] }>;
  incomeStatement: Record<string, { accounts: string[] }>;
}
