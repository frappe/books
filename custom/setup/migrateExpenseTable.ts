import { Fyo } from 'fyo';

/**
 * Migrates Expense table to add description column and numberSeries if they don't exist
 * Only runs for existing databases, not during new database setup
 */
export async function migrateExpenseTable(fyo: Fyo): Promise<void> {
  try {
    // Check if Expense schema exists
    if (!fyo.db.schemaMap['Expense']) {
      console.log('ℹ️ Expense schema not registered yet');
      return;
    }

    // Check if this is a new database by seeing if Expense table exists
    // If no Expense table exists, skip migration (new DB will be created with correct schema)
    try {
      const expenseCount = await fyo.db.count('Expense');
      // If we can count, table exists - run migration for existing data
      console.log(`ℹ️ Found ${expenseCount} existing expenses, running migration`);
      await fyo.db.migrateExpenseDescription();
    } catch (err) {
      // Table doesn't exist or query failed - this is likely a new database
      console.log('ℹ️ Expense table not found, skipping migration (new database)');
      return;
    }
  } catch (error) {
    console.error('Error migrating Expense table:', error);
    // Don't throw - this is not critical for app startup
  }
}
