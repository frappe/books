import { Fyo } from 'fyo';
import { unique } from 'fyo/utils';
import { FinancialStatements } from 'reports/FinancialStatements/financialStatements';
import { FinancialStatementOptions } from 'reports/types';

interface Row {
  indent?: number;
  account: string | { template: string };
  isGroup?: boolean;
  [key: string]: unknown;
}

export default class ProfitAndLoss {
  fyo: Fyo;
  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  async run(options: FinancialStatementOptions) {
    const { fromDate, toDate, periodicity } = options;
    const fs = new FinancialStatements(this.fyo);
    const income = await fs.getData({
      rootType: 'Income',
      balanceMustBe: 'Credit',
      fromDate,
      toDate,
      periodicity,
    });

    const expense = await fs.getData({
      rootType: 'Expense',
      balanceMustBe: 'Debit',
      fromDate,
      toDate,
      periodicity,
    });

    const incomeAccount = income.totalRow.account as string;
    const incomeTotalRow = {
      ...income.totalRow,
      account: {
        template: `<span class="font-semibold">${incomeAccount}</span>`,
      },
    };

    const expenseAccount = expense.totalRow.account as string;
    const expenseTotalRow = {
      ...expense.totalRow,
      account: {
        template: `<span class="font-semibold">${expenseAccount}</span>`,
      },
    };

    let rows = [
      ...income.accounts,
      incomeTotalRow,
      {
        account: {
          template: '<span>&nbsp;</span>',
        },
        isGroup: true,
      },
      ...expense.accounts,
      expenseTotalRow,
      {
        account: {
          template: '<span>&nbsp;</span>',
        },
        isGroup: true,
      },
    ] as Row[];

    rows = rows.map((row) => {
      if (row.indent === 0) {
        row.account = {
          template: `<span class="font-semibold">${row.account}</span>`,
        };
      }
      return row;
    });

    const columns = unique([...income.periodList, ...expense.periodList]);

    const profitRow: Row = {
      account: 'Total Profit',
    };

    for (const column of columns) {
      const incomeAmount =
        (income.totalRow[column] as number | undefined) ?? 0.0;
      const expenseAmount =
        (expense.totalRow[column] as number | undefined) ?? 0.0;

      profitRow[column] = incomeAmount - expenseAmount;

      rows.forEach((row) => {
        if (!row.isGroup) {
          row[column] = row[column] || 0.0;
        }
      });
    }

    rows.push(profitRow);

    return { rows, columns };
  }
}
