import { Fyo } from 'fyo';

/**
 * Adds description column to Expense table if it doesn't exist
 */
export default async function execute(fyo: Fyo) {
  try {
    // Check if column exists
    const result = await fyo.db.knex?.raw(
      `PRAGMA table_info(Expense)`
    );
    
    const columns = result || [];
    const hasDescription = columns.some((col: any) => col.name === 'description');
    
    if (!hasDescription) {
      // Add description column
      await fyo.db.knex?.raw(
        `ALTER TABLE Expense ADD COLUMN description TEXT`
      );
      console.log('✅ Added description column to Expense table');
    } else {
      console.log('ℹ️ Description column already exists in Expense table');
    }
  } catch (error) {
    console.error('Error adding description column to Expense:', error);
    throw error;
  }
}
