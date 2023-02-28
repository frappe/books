import { Money } from 'pesa';

export enum ValuationMethod {
  'FIFO' = 'FIFO',
  'MovingAverage' = 'MovingAverage',
}

export enum MovementType {
  'MaterialIssue' = 'MaterialIssue',
  'MaterialReceipt' = 'MaterialReceipt',
  'MaterialTransfer' = 'MaterialTransfer',
  'Manufacture' = 'Manufacture',
}

export interface SMDetails {
  date: Date;
  referenceName: string;
  referenceType: string;
}

export interface SMTransferDetails {
  item: string;
  rate: Money;
  quantity: number;
  batch?: string;
  fromLocation?: string;
  toLocation?: string;
}

export interface SMIDetails extends SMDetails, SMTransferDetails {}
