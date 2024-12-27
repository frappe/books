import { Doc } from 'fyo/model/doc';
import { Account } from '../Account/Account';
import { ListViewSettings } from 'fyo/model/types';
import { PaymentMethodType } from 'models/types';

export class PaymentMethod extends Doc {
  name?: string;
  account?: Account;
  type?: PaymentMethodType;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'type'],
    };
  }
}
