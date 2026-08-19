import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  const knexSchema = dm.db?.knex?.schema;

  await knexSchema?.alterTable('Item', (table) => {
    table.text('hsnCode').alter();
  });
}

export default { execute, beforeMigrate: true };
