import { Fyo } from 'fyo';

/**
 * Migrates Expense table to add description column if it doesn't exist
 */
export async function migrateExpenseTable(fyo: Fyo): Promise<void> {
  try {
    // Check if Expense schema exists
    if (!fyo.db.schemaMap['Expense']) {
      console.log('ℹ️ Expense schema not registered yet');
      return;
    }

    // Call bespoke function to add description column if needed
    await fyo.db.migrateExpenseDescription();
  } catch (error) {
    console.error('Error migrating Expense table:', error);
    // Don't throw - this is not critical for app startup
  }
}
