import { Money } from "pesa";

export type ItemQtyMap = {
    [item: string]: { availableQty: number;[batch: string]: number };
}

export type ItemSerialNumbers = { [item: string]: string };

export type DiscountType = "percent" | "amount";

export type ModalName = 'ShiftOpen' | 'ShiftClose' | 'Payment'

export interface POSItem {
    name: string,
    rate: Money,
    availableQty: number,
    unit: string,
    hasBatch: boolean,
    hasSerialNumber: boolean,
}