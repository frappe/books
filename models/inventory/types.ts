import { Money } from 'pesa';

export enum ValuationMethod {
  'FIFO' = 'FIFO',
  'MovingAverage' = 'MovingAverage',
}

export enum MovementTypeEnum {
  'MaterialIssue' = 'MaterialIssue',
  'MaterialReceipt' = 'MaterialReceipt',
  'MaterialTransfer' = 'MaterialTransfer',
  'Manufacture' = 'Manufacture',
}

export type MovementType =
  | 'MaterialIssue'
  | 'MaterialReceipt'
  | 'MaterialTransfer'
  | 'Manufacture';

export type SerialNumberStatus =
  | 'Inactive'
  | 'Active'
  | 'Delivered';

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
  serialNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  isReturn?: boolean;
}

export interface ReturnBalanceItemQty {
  item?: string;
  quantity: number;
  batch?: string | undefined;
  serialNumber?: string;
}

export interface DocItem {
  item: string;
  quantity: number;
  batch?: string | undefined;
  serialNumber?: string;
}

export interface ReturnDocItem {
  quantity: number;
  batches?: Record<string, { quantity: number, serialNumbers?: string[] }> | undefined;
  serialNumbers?: string[] | undefined;
}

export interface SMIDetails extends SMDetails, SMTransferDetails {}
