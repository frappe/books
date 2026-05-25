/**
 * et-gaap XBRL output for Estonian micro-OÜ annual reports.
 *
 * Namespace: `http://xbrl.eesti.ee/taxonomy/et-gaap_2026-01-01/`
 * Schema package cached under `taxonomy/et-gaap_2026-01-01/`.
 * Micro-OÜ presentation = role-201014 (balance sheet) + role-301011 (income
 * statement scheme 1) + role-101010 (general information).
 */

export type ContextKind = 'instant_end' | 'duration_year';

export interface XbrlFact {
  /** et-gaap element local name (e.g. `CurrentAssets`, `Revenue`). */
  element: string;
  /** Already-rounded integer EUR amount. */
  value: number;
  context: ContextKind;
}

export interface XbrlNote {
  /** et-gaap element local name (string-typed elements). */
  element: string;
  text: string;
  context: ContextKind;
}

export interface XbrlReportData {
  /** Company registry code (8 digits, no prefix). */
  registryCode: string;
  /** Period start (yyyy-mm-dd). */
  periodStart: string;
  /** Period end (yyyy-mm-dd). */
  periodEnd: string;
  /** Fiscal year for the report (e.g. 2026). */
  year: number;
  /** Required general-information facts (CompanyName, AnnualReportName, etc.). */
  generalInfo: XbrlFact[];
  /** Balance-sheet facts (instant_end context). */
  balanceSheet: XbrlFact[];
  /** Income statement facts (duration_year context). */
  incomeStatement: XbrlFact[];
  /** Mandatory notes (accounting policies, employee costs). */
  notes: XbrlNote[];
}

/**
 * Account → et-gaap mapping table.
 * Keys are et-gaap element local names; values are arrays of COA account
 * names (or account-name prefixes) to roll up into that element.
 *
 * `context` per element fixes whether the fact is `instant` (balance sheet)
 * or `duration` (P&L). The aggregator uses that to pick the right balance
 * snapshot vs. period total.
 */
export interface AccountMapping {
  balanceSheet: Record<string, { accounts: string[] }>;
  incomeStatement: Record<string, { accounts: string[] }>;
}
