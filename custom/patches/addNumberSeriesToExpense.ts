import { Fyo } from 'fyo';

/**
 * Adds numberSeries field to existing Expense records and creates EXP- number series
 */
export default async function execute(fyo: Fyo) {
  try {
    // Check if Expense table exists
    const hasTable = await fyo.db.knex!.schema.hasTable('Expense');
    if (!hasTable) {
      console.log('ℹ️ Expense table does not exist yet');
      return;
    }

    // Check if NumberSeries table has EXP- series
    const expSeries = await fyo.db.exists('NumberSeries', 'EXP-');
    if (!expSeries) {
      // Create EXP- number series
      const numberSeries = fyo.doc.getNewDoc('NumberSeries');
      await numberSeries.set('name', 'EXP-');
      await numberSeries.set('start', 1000);
      await numberSeries.set('padZeros', 4);
      await numberSeries.set('referenceType', 'Expense');
      await numberSeries.sync();
      console.log('✅ Created EXP- number series');
    }

    // Check if numberSeries column exists in Expense table
    const columns = await fyo.db.knex!.raw('PRAGMA table_info(Expense)') as any[];
    const hasNumberSeries = columns.some((col: any) => col.name === 'numberSeries');

    if (!hasNumberSeries) {
      // Add numberSeries column
      await fyo.db.knex!.raw('ALTER TABLE Expense ADD COLUMN numberSeries TEXT DEFAULT "EXP-"');
      console.log('✅ Added numberSeries column to Expense table');
    }

    // Update existing expenses that don't have numberSeries set
    const expensesWithoutSeries = await fyo.db.knex!('Expense')
      .where('numberSeries', null)
      .orWhere('numberSeries', '');

    if (expensesWithoutSeries.length > 0) {
      await fyo.db.knex!('Expense')
        .where('numberSeries', null)
        .orWhere('numberSeries', '')
        .update({ numberSeries: 'EXP-' });
      
      console.log(`✅ Updated ${expensesWithoutSeries.length} expenses with EXP- number series`);
    }

    console.log('✅ Expense numberSeries migration completed');
  } catch (error) {
    console.error('Error migrating Expense numberSeries:', error);
    // Don't throw - allow app to continue
  }
}
