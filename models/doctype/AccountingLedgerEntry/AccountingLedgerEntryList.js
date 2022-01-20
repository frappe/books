import { t } from 'frappejs/utils';

export default {
  doctype: 'AccountingLedgerEntry',
  title: t('Accounting Ledger Entries'),
  columns: ['account', 'party', 'debit', 'credit', 'balance'],
};
