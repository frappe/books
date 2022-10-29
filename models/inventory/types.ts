import { Money } from 'pesa';

export type MovementType =
  | 'MaterialIssue'
  | 'MaterialReceipt'
  | 'MaterialTransfer';

export interface SMDetails {
  date: Date;
  referenceName: string;
  referenceType: string;
}

export interface SMTransferDetails {
  item: string;
  rate: Money;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
}

export interface SMIDetails extends SMDetails, SMTransferDetails {}


export type StockQueueItem = { rate: Money; quantity: number };
