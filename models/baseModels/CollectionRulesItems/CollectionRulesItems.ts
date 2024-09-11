import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

export class CollectionRulesItems extends Doc {
  tierName?: string;
  collectionFactor?: number;
  minimumTotalSpent?: Money;
}
