import { DatabaseManager } from '../../database/manager';

/**
 * Re-runs the fixLedgerDateTime migration for users who already had the
 * original v0.21.2 patch recorded as executed. That patch used forEach with
 * async callbacks, which fires promises without awaiting them, so it completed
 * silently without updating any data.
 *
 * Root cause: AccountingLedgerEntry.date was stored as local midnight for
 * UTC+ timezone users (e.g. UTC+8). Local midnight on 2023-01-01 in UTC+8 is
 * 2022-12-31T16:00:00.000Z. SQLite's string comparison then places
 * "2022-12-31T16:00:00.000Z" < "2023-01-01", so those entries are filtered
 * into the wrong year in P&L and other account reports.
 *
 * Fix: overwrite every AccountingLedgerEntry.date with the UTC midnight of the
 * corresponding source document's date field (stored as a plain YYYY-MM-DD
 * string). new Date('YYYY-MM-DD') is parsed as UTC midnight per ISO 8601, so
 * toISOString() always yields 'YYYY-MM-DDT00:00:00.000Z', which compares
 * correctly against plain date strings and is consistent across all timezones.
 */
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
      const resp = (await dm
        .db!.knex!.select('name', 'date')
        .from(table)
        .where({ name: entry.referenceName })) as Array<{
        name: string;
        date: string;
      }>;

      if (resp.length !== 0) {
        // Source table dates are stored as plain 'YYYY-MM-DD' strings.
        // Parsing with new Date() treats them as UTC midnight (ISO 8601),
        // and toISOString() produces 'YYYY-MM-DDT00:00:00.000Z'.
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
