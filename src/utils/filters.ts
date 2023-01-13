import { t } from 'fyo';
import type { Doc } from 'fyo/model/doc';
import { ValueError } from 'fyo/utils/errors';
import type { Item } from 'models/baseModels/Item/Item';
import type { Party } from 'models/baseModels/Party/Party';
import type { Payment } from 'models/baseModels/Payment/Payment';
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';

export const routeFilters = {
  SalesItems: { for: ['in', ['Sales', 'Both']] },
  PurchaseItems: { for: ['in', ['Purchases', 'Both']] },
  Items: { for: 'Both' },
  PurchasePayments: { paymentType: 'Pay' },
  SalesPayments: { paymentType: 'Receive' },
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

export function getRouteData({ doc, uiname }: { doc?: Doc; uiname?: string }) {
  if (doc) {
    uiname = getUiName(doc);
  }

  if (!uiname) {
    throw new ValueError(`Doc and uiname not passed to getFilters`);
  }

  const routeFilter = routeFilters[uiname as keyof typeof routeFilters] ?? {};
  const createFilter =
    createFilters[uiname as keyof typeof createFilters] ?? {};
  const label = getLabelName(uiname);

  return { routeFilter, createFilter, label };
}

function getLabelName(uiname: string) {
  const labels = {
    SalesItems: t`Sales Items`,
    PurchaseItems: t`Purchase Items`,
    Items: t`Items`,
    Suppliers: t`Suppliers`,
    Customers: t`Customers`,
    Party: t`Party`,
    PurchasePayments: t`Purchase Payments`,
    SalesPayments: t`Sales Payments`,
  };

  return labels[uiname as keyof typeof labels] ?? fyo.schemaMap[uiname]?.label;
}

function getUiName(doc: Doc) {
  const isDual = [
    ModelNameEnum.Party,
    ModelNameEnum.Payment,
    ModelNameEnum.Item,
  ].includes(doc.schemaName as ModelNameEnum);

  if (!isDual) {
    return doc.schemaName;
  }

  if (doc.schemaName === ModelNameEnum.Party) {
    return getPartyUiName(doc as Party);
  }

  if (doc.schemaName === ModelNameEnum.Payment) {
    return getPaymentUiName(doc as Payment);
  }

  if (doc.schemaName === ModelNameEnum.Item) {
    return getItemUiName(doc as Item);
  }

  return doc.schemaName;
}

function getPartyUiName(doc: Party) {
  switch (doc.role) {
    case 'Customer':
      return 'Customers';
    case 'Supplier':
      return 'Suppliers';
    default:
      return doc.schemaName;
  }
}

function getPaymentUiName(doc: Payment) {
  switch (doc.paymentType) {
    case 'Pay':
      return 'PurchasePayments';
    case 'Receive':
      return 'SalesPayments';
    default:
      return doc.schemaName;
  }
}

function getItemUiName(doc: Item) {
  switch (doc.for) {
    case 'Purchases':
      return 'PurchaseItems';
    case 'Sales':
      return 'SalesItems';
    case 'Both':
      return 'Items';
    default:
      return doc.schemaName;
  }
}
