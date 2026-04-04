import {
  Cashflow,
  IncomeExpense,
  TopExpenses,
  TotalCreditAndDebit,
  TotalOutstanding,
} from 'utils/db/types';
import { ModelNameEnum } from '../../models/types';
import DatabaseCore from './core';
import { BespokeFunction } from './types';

export class BespokeQueries {
  [key: string]: BespokeFunction;

  static async getLastInserted(
    db: DatabaseCore,
    schemaName: string
  ): Promise<number> {
    const lastInserted = (await db.knex!.raw(
      'select cast(name as int) as num from ?? order by num desc limit 1',
      [schemaName]
    )) as { num: number }[];

    const num = lastInserted?.[0]?.num;
    if (num === undefined) {
      return 0;
    }
    return num;
  }

  static async getTopExpenses(
    db: DatabaseCore,
    fromDate: string,
    toDate: string
  ) {
    const expenseAccounts = db
      .knex!.select('name')
      .from('Account')
      .where('rootType', 'Expense');

    const topExpenses = await db
      .knex!.select({
        total: db.knex!.raw('sum(cast(debit as real) - cast(credit as real))'),
      })
      .select('account')
      .from('AccountingLedgerEntry')
      .where('reverted', false)
      .where('account', 'in', expenseAccounts)
      .whereBetween('date', [fromDate, toDate])
      .groupBy('account')
      .orderBy('total', 'desc')
      .limit(5);
    return topExpenses as TopExpenses;
  }

  static async getTotalOutstanding(
    db: DatabaseCore,
    schemaName: string,
    fromDate: string,
    toDate: string
  ) {
    return (await db.knex!(schemaName)
      .sum({ total: 'baseGrandTotal' })
      .sum({ outstanding: 'outstandingAmount' })
      .where('submitted', true)
      .where('cancelled', false)
      .whereBetween('date', [fromDate, toDate])
      .first()) as TotalOutstanding;
  }

  static async getCashflow(db: DatabaseCore, fromDate: string, toDate: string) {
    const cashAndBankAccounts = db.knex!('Account')
      .select('name')
      .where('accountType', 'in', ['Cash', 'Bank'])
      .andWhere('isGroup', false);
    const dateAsMonthYear = db.knex!.raw(`strftime('%Y-%m', ??)`, 'date');
    return (await db.knex!('AccountingLedgerEntry')
      .where('reverted', false)
      .sum({
        inflow: 'debit',
        outflow: 'credit',
      })
      .select({
        yearmonth: dateAsMonthYear,
      })
      .where('account', 'in', cashAndBankAccounts)
      .whereBetween('date', [fromDate, toDate])
      .groupBy(dateAsMonthYear)) as Cashflow;
  }

  static async getIncomeAndExpenses(
    db: DatabaseCore,
    fromDate: string,
    toDate: string
  ) {
    const income = (await db.knex!.raw(
      `
      select sum(cast(credit as real) - cast(debit as real)) as balance, strftime('%Y-%m', date) as yearmonth
      from AccountingLedgerEntry
      where
        reverted = false and
        date between date(?) and date(?) and
        account in (
          select name
          from Account
          where rootType = 'Income'
        )
      group by yearmonth`,
      [fromDate, toDate]
    )) as IncomeExpense['income'];

    const expense = (await db.knex!.raw(
      `
      select sum(cast(debit as real) - cast(credit as real)) as balance, strftime('%Y-%m', date) as yearmonth
      from AccountingLedgerEntry
      where
        reverted = false and
        date between date(?) and date(?) and
        account in (
          select name
          from Account
          where rootType = 'Expense'
        )
      group by yearmonth`,
      [fromDate, toDate]
    )) as IncomeExpense['expense'];

    return { income, expense };
  }

  static async getTotalCreditAndDebit(db: DatabaseCore) {
    return (await db.knex!.raw(`
    select 
	    account, 
      sum(cast(credit as real)) as totalCredit, 
      sum(cast(debit as real)) as totalDebit
    from AccountingLedgerEntry
    group by account
    `)) as unknown as TotalCreditAndDebit;
  }

  static async getStockQuantity(
    db: DatabaseCore,
    item: string,
    location?: string,
    fromDate?: string,
    toDate?: string,
    batch?: string,
    serialNumbers?: string[]
  ): Promise<number | null> {
    /* eslint-disable @typescript-eslint/no-floating-promises */
    const query = db.knex!(ModelNameEnum.StockLedgerEntry)
      .sum('quantity')
      .where('item', item);

    if (location) {
      query.andWhere('location', location);
    }

    if (batch) {
      query.andWhere('batch', batch);
    }

    if (serialNumbers?.length) {
      query.andWhere('serialNumber', 'in', serialNumbers);
    }

    if (fromDate) {
      query.andWhereRaw('datetime(date) > datetime(?)', [fromDate]);
    }

    if (toDate) {
      query.andWhereRaw('datetime(date) < datetime(?)', [toDate]);
    }

    const value = (await query) as Record<string, number | null>[];
    if (!value.length) {
      return null;
    }

    return value[0][Object.keys(value[0])[0]];
  }
}
