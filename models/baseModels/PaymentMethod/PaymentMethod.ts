import { Doc } from 'fyo/model/doc';
import { Account } from '../Account/Account';

export class PaymentMethod extends Doc {
  name?: string;
  account?: Account;
}
