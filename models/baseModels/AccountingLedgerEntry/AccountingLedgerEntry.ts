import Doc from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class AccountingLedgerEntry extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['account', 'party', 'debit', 'credit', 'balance'],
    };
  }
}
