import Doc from 'frappe/model/doc';
import { ListViewSettings } from 'frappe/model/types';

export class AccountingLedgerEntry extends Doc {
  static listSettings: ListViewSettings = {
    columns: ['account', 'party', 'debit', 'credit', 'balance'],
  };
}
