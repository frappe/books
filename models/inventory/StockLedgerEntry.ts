import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';


export class StockLedgerEntry extends Doc {
  date?: Date;
  item?: string;
  rate?: Money;
  quantity?: number;
  location?: string;
  referenceName?: string;
  referenceType?: string;
  batchNumber?: string;
}
