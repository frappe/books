import frappe from 'frappejs';

export default async function execute() {
  // Since sqlite has no ALTER TABLE to change column meta
  // the table has to be _Prestiged_.
  const tableInfo = await frappe.db.sql('pragma table_info("Payment")');
  const referenceId = tableInfo.find(({ name }) => name === 'referenceId');
  if (!referenceId || !referenceId.notnull) {
    return;
  }

  await frappe.db.createTable('Payment', '__Payment');
  await frappe.db.sql('insert into __Payment select * from Payment');

  const mainCount = await frappe.db.knex
    .table('Payment')
    .count('name as count');
  const replCount = await frappe.db.knex
    .table('__Payment')
    .count('name as count');

  if (mainCount[0].count === replCount[0].count) {
    await frappe.db.knex.schema.dropTable('Payment');
    await frappe.db.knex.schema.renameTable('__Payment', 'Payment');
  } else {
    await frappe.db.knex.schema.dropTable('__Payment');
  }
}
