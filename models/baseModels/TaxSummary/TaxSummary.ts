import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

export class TaxSummary extends Doc {
  account?: string;
  rate?: number;
  amount?: Money;
}
