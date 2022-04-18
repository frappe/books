import Doc from 'frappe/model/doc';
import { ListViewSettings } from 'frappe/model/types';

export class AccountingLedgerEntry extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['account', 'party', 'debit', 'credit', 'balance'],
    };
  }
}
