import { _ } from 'frappejs/utils';

export default {
  doctype: 'AccountingLedgerEntry',
  title: _('Accounting Ledger Entries'),
  columns: [
    'account',
    'party',
    'debit',
    'credit',
    'balance'
  ]
}
