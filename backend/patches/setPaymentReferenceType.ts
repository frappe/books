import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  await dm.db!.knex!('Payment')
    .where({ referenceType: null })
    .update({ referenceType: 'SalesInvoice' });
}

export default { execute, beforeMigrate: true };
