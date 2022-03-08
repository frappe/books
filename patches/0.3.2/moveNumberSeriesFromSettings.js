import { invertMap } from '@/utils';
import frappe from 'frappe';
import { DEFAULT_NUMBER_SERIES } from 'frappe/utils/consts';

async function setReferencesOnNumberSeries() {
  const map = invertMap(DEFAULT_NUMBER_SERIES);
  const rows = await frappe.db.knex('NumberSeries');
  for (const row of rows) {
    if (row.referenceType === map[row.name]) {
      return;
    }

    row.referenceType = map[row.name];
  }
  await frappe.db.prestigeTheTable('NumberSeries', rows);
}

export default async function execute() {
  await setReferencesOnNumberSeries();
}
