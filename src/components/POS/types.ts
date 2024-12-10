import { Money } from 'pesa';

export type ItemQtyMap = {
  [item: string]: { availableQty: number; [batch: string]: number };
};

export type ItemSerialNumbers = { [item: string]: string };

export type DiscountType = 'percent' | 'amount';

export const modalNames = [
  'Keyboard',
  'Payment',
  'ShiftClose',
  'LoyaltyProgram',
  'SavedInvoice',
  'Alert',
  'CouponCode',
  'PriceList',
] as const;

export type ModalName = typeof modalNames[number];

export type PosEmits =
  | 'addItem'
  | 'toggleView'
  | 'toggleModal'
  | 'setCashAmount'
  | 'setCouponsCount'
  | 'routeToSinvList'
  | 'applyPricingRule'
  | 'setTransferRefNo'
  | 'setLoyaltyPoints'
  | 'setTransferAmount'
  | 'createTransaction'
  | 'selectedInvoiceName'
  | 'setTransferClearanceDate';

export interface POSItem {
  id?: number;
  image?: string;
  name: string;
  rate: Money;
  availableQty: number;
  unit: string;
  hasBatch: boolean;
  hasSerialNumber: boolean;
}
