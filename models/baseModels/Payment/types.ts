export type PaymentType = 'Receive' | 'Pay';
export type PaymentMethod = 'Cash' | 'Cheque' | 'Transfer';

export enum PaymentTypeEnum{
    Receive = 'Receive', 
    Pay = 'Pay'
}

export enum AccountFieldEnum{
    Account = 'account',
    PaymentAccount = 'paymentAccount'
}
