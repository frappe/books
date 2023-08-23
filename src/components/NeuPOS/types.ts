export type ItemQtyMap = {
    [item: string]: { availableQty: number;[batch: string]: number };
}

export type ItemSerialNumbers = { [item: string]: string }

export enum DiscountType {
    Percent= "percent",
    Amount= "amount"
}