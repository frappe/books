import { Fyo } from 'fyo';
import { unique } from 'fyo/utils';
import { FinancialStatements } from 'reports/FinancialStatements/financialStatements';
import { FinancialStatementOptions } from 'reports/types';

class BalanceSheet {
  async run(options: FinancialStatementOptions, fyo: Fyo) {
    const { fromDate, toDate, periodicity } = options;
    const fs = new FinancialStatements(fyo);
    const asset = await fs.getData({
      rootType: 'Asset',
      balanceMustBe: 'Debit',
      fromDate,
      toDate,
      periodicity,
      accumulateValues: true,
    });

    const liability = await fs.getData({
      rootType: 'Liability',
      balanceMustBe: 'Credit',
      fromDate,
      toDate,
      periodicity,
      accumulateValues: true,
    });

    const equity = await fs.getData({
      rootType: 'Equity',
      balanceMustBe: 'Credit',
      fromDate,
      toDate,
      periodicity,
      accumulateValues: true,
    });

    const rows = [
      ...asset.accounts,
      asset.totalRow,
      [],
      ...liability.accounts,
      liability.totalRow,
      [],
      ...equity.accounts,
      equity.totalRow,
      [],
    ];

    const columns = unique([
      ...asset.periodList,
      ...liability.periodList,
      ...equity.periodList,
    ]);

    return { rows, columns };
  }
}

export default BalanceSheet;
