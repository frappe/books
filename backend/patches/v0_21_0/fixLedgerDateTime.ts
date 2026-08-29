import { DatabaseManager } from '../../database/manager';

async function execute(dm: DatabaseManager) {
  const sourceTables = [
    'PurchaseInvoice',
    'SalesInvoice',
    'JournalEntry',
    'Payment',
    'StockMovement',
    'StockTransfer',
  ];

  const entries = (await dm.db!.knex!('AccountingLedgerEntry').select(
    'name',
    'date',
    'referenceName'
  )) as Array<{ name: string; date: string; referenceName: string }>;

  for (const entry of entries) {
    for (const table of sourceTables) {
      const resp = (await dm.db!
        .knex!.select('name', 'date')
        .from(table)
        .where({ name: entry.referenceName })) as Array<{
        name: string;
        date: string;
      }>;

      if (resp.length !== 0) {
        // Source table dates are stored as plain 'YYYY-MM-DD' strings.
        // new Date('YYYY-MM-DD') is parsed as UTC midnight per ISO 8601,
        // so toISOString() yields 'YYYY-MM-DDT00:00:00.000Z'.
        // This ensures the stored datetime always uses UTC midnight so that
        // SQLite date comparisons and report range-key extraction both work
        // correctly for UTC+ timezone users.
        const dateTimeValue = new Date(resp[0].date);
        await dm.db!.knex!('AccountingLedgerEntry')
          .where({ name: entry.name })
          .update({ date: dateTimeValue.toISOString() });

        // Date found in this source table; no need to check the rest.
        break;
      }
    }
  }
}

export default { execute, beforeMigrate: true };
