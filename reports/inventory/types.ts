import { ModelNameEnum } from "models/types";

export interface RawStockLedgerEntry {
  name: string;
  date: string;
  item: string;
  rate: string;
  batchNumber: string | null;
  quantity: number;
  location: string;
  referenceName: string;
  referenceType: string;
  [key: string]: unknown;
}


export interface ComputedStockLedgerEntry{
  name: number;
  date: Date;

  item: string;
  location:string;
  batchNumber: string;

  quantity: number;
  balanceQuantity: number;

  incomingRate: number;
  valuationRate:number;

  balanceValue:number;
  valueChange:number;
  
  referenceName: string;
  referenceType: string;
}


export interface StockBalanceEntry{
  name: number;

  item: string;
  location:string;
  batchNumber: string;

  balanceQuantity: number;
  balanceValue: number;
  
  openingQuantity: number;
  openingValue:number;
  
  incomingQuantity:number;
  incomingValue:number;
  
  outgoingQuantity:number;
  outgoingValue:number;

  valuationRate:number;
}

export type ReferenceType =
  | ModelNameEnum.StockMovement
  | ModelNameEnum.Shipment
  | ModelNameEnum.PurchaseReceipt
  | 'All';
