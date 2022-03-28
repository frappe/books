import { cloneDeep } from 'lodash';
import { SchemaMap, SchemaStub, SchemaStubMap } from 'schemas/types';
import {
  addMetaFields,
  cleanSchemas,
  getAbstractCombinedSchemas,
} from '../../../schemas';
import SingleValue from '../../../schemas/core/SingleValue.json';

const Customer = {
  name: 'Customer',
  label: 'Customer',
  fields: [
    {
      fieldname: 'name',
      label: 'Name',
      fieldtype: 'Data',
      default: 'John Thoe',
      required: true,
    },
    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      placeholder: 'john@thoe.com',
    },
  ],
  quickEditFields: ['email'],
  keywordFields: ['name'],
};

const SalesInvoiceItem = {
  name: 'SalesInvoiceItem',
  label: 'Sales Invoice Item',
  isChild: true,
  fields: [
    {
      fieldname: 'item',
      label: 'Item',
      fieldtype: 'Data',
      required: true,
    },
    {
      fieldname: 'quantity',
      label: 'Quantity',
      fieldtype: 'Float',
      required: true,
      default: 1,
    },
    {
      fieldname: 'rate',
      label: 'Rate',
      fieldtype: 'Currency',
      required: true,
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      computed: true,
      readOnly: true,
    },
  ],
  tableFields: ['item', 'quantity', 'rate', 'amount'],
};

const SalesInvoice = {
  name: 'SalesInvoice',
  label: 'Sales Invoice',
  isSingle: false,
  isChild: false,
  isSubmittable: true,
  keywordFields: ['name', 'customer'],
  fields: [
    {
      label: 'Invoice No',
      fieldname: 'name',
      fieldtype: 'Data',
      required: true,
      readOnly: true,
    },
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
    },
    {
      fieldname: 'customer',
      label: 'Customer',
      fieldtype: 'Link',
      target: 'Customer',
      required: true,
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Data',
      required: true,
    },
    {
      fieldname: 'items',
      label: 'Items',
      fieldtype: 'Table',
      target: 'SalesInvoiceItem',
      required: true,
    },
    {
      fieldname: 'grandTotal',
      label: 'Grand Total',
      fieldtype: 'Currency',
      computed: true,
      readOnly: true,
    },
  ],
};

const SystemSettings = {
  name: 'SystemSettings',
  label: 'System Settings',
  isSingle: true,
  isChild: false,
  fields: [
    {
      fieldname: 'dateFormat',
      label: 'Date Format',
      fieldtype: 'Select',
      options: [
        {
          label: '23/03/2022',
          value: 'dd/MM/yyyy',
        },
        {
          label: '03/23/2022',
          value: 'MM/dd/yyyy',
        },
      ],
      default: 'dd/MM/yyyy',
      required: true,
    },
    {
      fieldname: 'locale',
      label: 'Locale',
      fieldtype: 'Data',
      default: 'en-IN',
    },
  ],
  quickEditFields: ['locale', 'dateFormat'],
  keywordFields: [],
};

export function getBuiltTestSchemaMap(): SchemaMap {
  const testSchemaMap: SchemaStubMap = {
    SingleValue: SingleValue as SchemaStub,
    Customer: Customer as SchemaStub,
    SalesInvoice: SalesInvoice as SchemaStub,
    SalesInvoiceItem: SalesInvoiceItem as SchemaStub,
    SystemSettings: SystemSettings as SchemaStub,
  };

  const schemaMapClone = cloneDeep(testSchemaMap);
  const abstractCombined = getAbstractCombinedSchemas(schemaMapClone);
  const cleanedSchemas = cleanSchemas(abstractCombined);
  return addMetaFields(cleanedSchemas);
}
