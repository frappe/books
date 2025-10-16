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
import { DocItem, ReturnDocItem } from 'models/inventory/types';
import { safeParseFloat } from 'utils/index';

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

    let topExpenses = await db
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

    if (topExpenses.length === 0) {
      topExpenses = await db.knex!('PurchaseInvoiceItem as piItem')
        .join('PurchaseInvoice as pi', 'piItem.parent', 'pi.name')
        .select({
          total: db.knex!.raw('sum(cast(piItem.baseAmount as real))'),
          account: 'piItem.account',
        })
        .where('pi.submitted', true)
        .where('pi.cancelled', false)
        .whereBetween('pi.date', [fromDate, toDate])
        .where('piItem.account', 'in', expenseAccounts)
        .groupBy('piItem.account')
        .orderBy('total', 'desc')
        .limit(5);
    }

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
    let income = (await db.knex!.raw(
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

    let expense = (await db.knex!.raw(
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

    if (income.length === 0) {
      income = await db.knex!('SalesInvoice')
        .select(
          db.knex!.raw(
            "sum(cast(baseGrandTotal as real)) as balance, strftime('%Y-%m', date) as yearmonth"
          )
        )
        .where('submitted', true)
        .where('cancelled', false)
        .whereBetween('date', [fromDate, toDate])
        .groupBy('yearmonth');
    }

    if (expense.length === 0) {
      expense = await db.knex!('PurchaseInvoice')
        .select(
          db.knex!.raw(
            "sum(cast(baseGrandTotal as real)) as balance, strftime('%Y-%m', date) as yearmonth"
          )
        )
        .where('submitted', true)
        .where('cancelled', false)
        .whereBetween('date', [fromDate, toDate])
        .groupBy('yearmonth');
    }

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

  static async getReturnBalanceItemsQty(
    db: DatabaseCore,
    schemaName: ModelNameEnum,
    docName: string
  ): Promise<Record<string, ReturnDocItem> | undefined> {
    const returnDocNames = (
      await db.knex!(schemaName)
        .select('name')
        .where('returnAgainst', docName)
        .andWhere('submitted', true)
        .andWhere('cancelled', false)
    ).map((i: { name: string }) => i.name);

    if (!returnDocNames.length) {
      return;
    }

    const returnedItemsQuery = db.knex!(`${schemaName}Item`)
      .sum({ quantity: 'quantity' })
      .whereIn('parent', returnDocNames);

    const docItemsQuery = db.knex!(`${schemaName}Item`)
      .where('parent', docName)
      .sum({ quantity: 'quantity' });

    if (
      [ModelNameEnum.SalesInvoice, ModelNameEnum.PurchaseInvoice].includes(
        schemaName
      )
    ) {
      returnedItemsQuery.select('item', 'batch').groupBy('item', 'batch');
      docItemsQuery.select('name', 'item', 'batch').groupBy('item', 'batch');
    }

    if (
      [ModelNameEnum.Shipment, ModelNameEnum.PurchaseReceipt].includes(
        schemaName
      )
    ) {
      returnedItemsQuery
        .select('item', 'batch', 'serialNumber')
        .groupBy('item', 'batch', 'serialNumber');
      docItemsQuery
        .select('name', 'item', 'batch', 'serialNumber')
        .groupBy('item', 'batch', 'serialNumber');
    }

    const returnedItems = (await returnedItemsQuery) as DocItem[];
    if (!returnedItems.length) {
      return;
    }
    const docItems = (await docItemsQuery) as DocItem[];

    const docItemsMap = BespokeQueries.#getDocItemMap(docItems);
    const returnedItemsMap = BespokeQueries.#getDocItemMap(returnedItems);

    const returnBalanceItems = BespokeQueries.#getReturnBalanceItemQtyMap(
      docItemsMap,
      returnedItemsMap
    );
    return returnBalanceItems;
  }

  static #getDocItemMap(docItems: DocItem[]): Record<string, ReturnDocItem> {
    const docItemsMap: Record<string, ReturnDocItem> = {};
    const batchesMap:
      | Record<
          string,
          { quantity: number; serialNumbers?: string[] | undefined }
        >
      | undefined = {};

    for (const item of docItems) {
      if (!!docItemsMap[item.item]) {
        if (item.batch) {
          let serialNumbers: string[] | undefined;

          if (!docItemsMap[item.item].batches![item.batch]) {
            docItemsMap[item.item].batches![item.batch] = {
              quantity: item.quantity,
              serialNumbers,
            };
          } else {
            docItemsMap[item.item].batches![item.batch] = {
              quantity: (docItemsMap[item.item].batches![item.batch].quantity +=
                item.quantity),
              serialNumbers,
            };
          }
        } else {
          docItemsMap[item.item].quantity += item.quantity;
        }

        if (item.serialNumber) {
          const serialNumbers: string[] = [];

          if (docItemsMap[item.item].serialNumbers) {
            serialNumbers.push(...(docItemsMap[item.item].serialNumbers ?? []));
          }

          serialNumbers.push(...item.serialNumber.split('\n'));
          docItemsMap[item.item].serialNumbers = serialNumbers;
        }
        continue;
      }

      if (item.batch) {
        let serialNumbers: string[] | undefined = undefined;
        if (item.serialNumber) {
          serialNumbers = item.serialNumber.split('\n');
        }

        batchesMap[item.batch] = {
          serialNumbers,
          quantity: item.quantity,
        };
      }

      let serialNumbers: string[] | undefined = undefined;

      if (!item.batch && item.serialNumber) {
        serialNumbers = item.serialNumber.split('\n');
      }

      docItemsMap[item.item] = {
        serialNumbers,
        batches: batchesMap,
        quantity: item.quantity,
      };
    }
    return docItemsMap;
  }

  static #getReturnBalanceItemQtyMap(
    docItemsMap: Record<string, ReturnDocItem>,
    returnedItemsMap: Record<string, ReturnDocItem>
  ): Record<string, ReturnDocItem> {
    const returnBalanceItems: Record<string, ReturnDocItem> | undefined = {};
    const balanceBatchQtyMap:
      | Record<
          string,
          { quantity: number; serialNumbers: string[] | undefined }
        >
      | undefined = {};

    for (const row in docItemsMap) {
      const balanceSerialNumbersMap: string[] | undefined = [];
      let balanceQty = safeParseFloat(-docItemsMap[row].quantity);
      const docItem = docItemsMap[row];
      const returnedDocItem = returnedItemsMap[row];
      const docItemHasBatch = !!Object.keys(docItem.batches ?? {}).length;

      if (returnedItemsMap) {
        for (const item in returnedItemsMap) {
          if (docItemHasBatch && item !== row) {
            continue;
          }

          balanceQty = -(
            Math.abs(balanceQty) + returnedItemsMap[item].quantity
          );

          const returnedItem = returnedItemsMap[item];

          if (docItem.serialNumbers && returnedItem.serialNumbers) {
            for (const serialNumber of docItem.serialNumbers) {
              if (!returnedItem.serialNumbers.includes(serialNumber)) {
                balanceSerialNumbersMap.push(serialNumber);
              }
            }
          }
        }
      }

      if (docItemHasBatch && docItem.batches) {
        for (const batch in docItem.batches) {
          const docItemSerialNumbers = docItem.batches[batch].serialNumbers;
          const itemSerialNumbers = docItem.batches[batch].serialNumbers;
          let balanceSerialNumbers: string[] | undefined;

          if (docItemSerialNumbers && itemSerialNumbers) {
            balanceSerialNumbers = docItemSerialNumbers.filter(
              (serialNumber: string) =>
                itemSerialNumbers.indexOf(serialNumber) == -1
            );
          }

          const ItemQty = Math.abs(docItem.batches[batch].quantity);
          let balanceQty = safeParseFloat(-ItemQty);

          if (!returnedDocItem || !returnedDocItem?.batches) {
            continue;
          }

          const returnedItem = returnedDocItem?.batches[batch];

          if (!returnedItem) {
            balanceBatchQtyMap[batch] = {
              quantity: balanceQty,
              serialNumbers: balanceSerialNumbers,
            };
            continue;
          }

          balanceQty = -(
            Math.abs(safeParseFloat(-ItemQty)) -
            Math.abs(returnedDocItem.batches[batch].quantity)
          );

          balanceBatchQtyMap[batch] = {
            quantity: balanceQty,
            serialNumbers: balanceSerialNumbers,
          };
        }
      }

      returnBalanceItems[row] = {
        quantity: balanceQty,
        batches: balanceBatchQtyMap,
        serialNumbers: balanceSerialNumbersMap,
      };
    }

    return returnBalanceItems;
  }

  static async getPOSTransactedAmount(
    db: DatabaseCore,
    fromDate: Date,
    toDate: Date,
    lastShiftClosingDate?: Date
  ): Promise<Record<string, number> | undefined> {
    const invoicesQuery = db.knex!(ModelNameEnum.SalesInvoice)
      .select('name', 'returnAgainst')
      .where('isPOS', true)
      .andWhereBetween('date', [fromDate.toISOString(), toDate.toISOString()]);

    if (lastShiftClosingDate) {
      invoicesQuery.andWhere(
        'created',
        '>',
        lastShiftClosingDate.toISOString()
      );
    }

    const invoices = (await invoicesQuery) as {
      name: string;
      returnAgainst: string | null;
    }[];

    if (!invoices.length) {
      return;
    }

    const sinvNames = invoices.map((row) => row.name);
    const invoiceSignMap = invoices.reduce<Record<string, number>>(
      (map, inv) => {
        map[inv.name] = inv.returnAgainst ? -1 : 1;
        return map;
      },
      {}
    );

    const paymentEntryNames: string[] = (
      await db.knex!(ModelNameEnum.PaymentFor)
        .select('parent', 'referenceName')
        .whereIn('referenceName', sinvNames)
    ).map((doc: { parent: string }) => doc.parent);

    if (!paymentEntryNames.length) {
      return;
    }

    const groupedAmounts = (await db.knex!(ModelNameEnum.Payment)
      .select('paymentMethod', 'name')
      .whereIn('name', paymentEntryNames)
      .groupBy('paymentMethod', 'name')
      .sum({ amount: 'amount' })) as {
      paymentMethod: string;
      name: string;
      amount: number;
    }[];

    const transactedAmounts: Record<string, number> = {};

    for (const row of groupedAmounts) {
      const paymentRefs = (await db.knex!(ModelNameEnum.PaymentFor)
        .select('referenceName')
        .where('parent', row.name)) as { referenceName: string }[];

      for (const ref of paymentRefs) {
        const sign = invoiceSignMap[ref.referenceName] ?? 1;
        const signedAmount = Number(row.amount) * sign;

        transactedAmounts[row.paymentMethod] =
          (transactedAmounts[row.paymentMethod] ?? 0) + signedAmount;
      }
    }

    return transactedAmounts;
  }
}
