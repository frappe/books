import { ModelNameEnum } from 'models/types';

export const routeFilters = {
  SalesItems: { for: ['in', ['Sales', 'Both']] },
  PurchaseItems: { for: ['in', ['Purchases', 'Both']] },
  Items: { for: 'Both' },
  PurchasePayments: {
    referenceType: ModelNameEnum.PurchaseInvoice,
  },
  SalesPayments: {
    referenceType: ModelNameEnum.SalesInvoice,
  },
  Suppliers: { role: ['in', ['Supplier', 'Both']] },
  Customers: { role: ['in', ['Customer', 'Both']] },
  Party: { role: 'Both' },
};

export const createFilters = {
  SalesItems: { for: 'Sales' },
  PurchaseItems: { for: 'Purchases' },
  Items: { for: 'Both' },
  PurchasePayments: { paymentType: 'Pay' },
  SalesPayments: { paymentType: 'Receive' },
  Suppliers: { role: 'Supplier' },
  Customers: { role: 'Customer' },
  Party: { role: 'Both' },
};
