import { Doc } from 'fyo/model/doc';
import type { Transfer } from './Transfer';
import type { Money } from 'pesa';

export class TransferItem extends Doc {
  item?: string;

  unit?: string;
  transferUnit?: string;
  quantity?: number;
  transferQuantity?: number;
  unitConversionFactor?: number;

  rate?: Money;
  amount?: Money;

  batch?: string;
  serialNumber?: string;

  parentdoc?: Transfer;
}
