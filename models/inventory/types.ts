import { Money } from "pesa";

export type MovementType =
  | 'MaterialIssue'
  | 'MaterialReceipt'
  | 'MaterialTransfer';

export interface SMDetails {
  date: Date;
  item: string;
  rate: Money;
  quantity: number;
  referenceName: string;
  referenceType: string;
  fromLocation?: string;
  toLocation?: string;
}

export type StockQueueItem = { rate: Money; quantity: number };