
export interface RawStockLedgerEntry {
  name: string;
  date: string;
  item: string;
  rate: string;
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

  quantity: number;
  balanceQuantity: number;

  incomingRate: number;
  valuationRate:number;

  balanceValue:number;
  valueChange:number;
  
  referenceName: string;
  referenceType: string;
}
