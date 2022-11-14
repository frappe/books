import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

export class StockTransferItem extends Doc {
  item?: string;
  location?: string;
  quantity?: number;
  rate?: Money;
  amount?: Money;
  unit?: string;
  description?: string;
  hsnCode?: number;
}
