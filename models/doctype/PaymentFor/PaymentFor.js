import frappe from 'frappe';
import { _ } from 'frappe/utils';

const referenceTypeMap = {
  SalesInvoice: _('Invoice'),
  PurchaseInvoice: _('Bill'),
};

export default {
  name: 'PaymentFor',
  label: 'Payment For',
  isSingle: 0,
  isChild: 1,
  keywordFields: [],
  tableFields: ['referenceType', 'referenceName', 'amount'],
  fields: [
    {
      fieldname: 'referenceType',
      label: 'Reference Type',
      placeholder: 'Type',
      fieldtype: 'Select',
      options: Object.keys(referenceTypeMap),
      map: referenceTypeMap,
      required: 1,
    },
    {
      fieldname: 'referenceName',
      label: 'Reference Name',
      fieldtype: 'DynamicLink',
      references: 'referenceType',
      placeholder: 'Name',
      getFilters() {
        return {
          outstandingAmount: ['>', 0],
        };
      },
      required: 1,
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      formula: (row, doc) => {
        return (
          doc.getFrom(
            row.referenceType,
            row.referenceName,
            'outstandingAmount'
          ) || frappe.pesa(0)
        );
      },
      required: 1,
    },
  ],
};
