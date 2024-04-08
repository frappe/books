import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

export abstract class CashDenominations extends Doc {
  denomination?: Money;
}
