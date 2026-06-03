import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  const knex = dm.db?.knex;
  if (!knex) {
    return;
  }

  const hasColumn = await knex.schema.hasColumn('JournalEntry', 'lhvVatCode');
  if (!hasColumn) {
    return;
  }

  await knex('JournalEntry')
    .where({ lhvVatCode: 'ZERO_EU_B2B' })
    .update({ lhvVatCode: 'ZERO_EU_GOODS' });
}

export default { execute };
