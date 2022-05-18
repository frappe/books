export enum TransferTypeEnum {
  'B2B' = 'B2B',
  'B2CL' = 'B2CL',
  'B2CS' = 'B2CS',
  'NR' = 'NR',
}

export type TransferType = keyof typeof TransferTypeEnum;
export type GSTRType = 'GSTR-1' | 'GSTR-2';
export interface GSTRRow {
  gstin: string;
  partyName: string;
  invNo: string;
  invDate: Date;
  rate: number;
  reverseCharge: 'Y' | 'N';
  inState: boolean;
  place: string;
  invAmt: number;
  taxVal: number;
  igstAmt?: number;
  cgstAmt?: number;
  sgstAmt?: number;
  exempt?: boolean;
  nonGST?: boolean;
  nilRated?: boolean;
}
