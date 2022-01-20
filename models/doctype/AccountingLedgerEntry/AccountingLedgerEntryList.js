import { _ } from 'frappe/utils';

export default {
  doctype: 'AccountingLedgerEntry',
  title: _('Accounting Ledger Entries'),
  columns: ['account', 'party', 'debit', 'credit', 'balance'],
};
