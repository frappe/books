import test from 'tape';
import { Party } from '../models/baseModels/Party/Party';

test('Customer list view settings should show Name, Phone, Last Purchase On, Amount Spent and Outstanding Amount', async (t) => {
  const settings = Party.getListViewSettings();
  const expectedColumns = ['name', 'phone', 'lastPurchaseOn', 'amountSpent', 'outstandingAmount'];
  
  t.deepEqual(settings.columns, expectedColumns, 'List view columns should match the requirements');
  t.end();
});
