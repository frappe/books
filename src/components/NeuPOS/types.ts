export type ItemQtyMap = {
    [item: string]: { availableQty: number;[batch: string]: number };
}

export type ItemSerialNumbers = { [item: string]: string };

export type DiscountType = "percent" | "amount";

export type ModalName = 'ShiftOpen' | 'ShiftClose' | 'Payment'