import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  await dm.db!.knex!('Payment')
    .where({ referenceType: null, paymentType: 'Pay' })
    .update({ referenceType: 'PurchaseInvoice' });
  await dm.db!.knex!('Payment')
    .where({ referenceType: null, paymentType: 'Receive' })
    .update({ referenceType: 'SalesInvoice' });
}

export default { execute, beforeMigrate: true };
