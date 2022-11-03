import assert from 'assert';
import { cloneDeep } from 'lodash';
import {
  addMetaFields,
  cleanSchemas,
  getAbstractCombinedSchemas,
} from '../../../schemas';
import SingleValue from '../../../schemas/core/SingleValue.json';
import { SchemaMap, SchemaStub, SchemaStubMap } from '../../../schemas/types';

const Customer = {
  name: 'Customer',
  label: 'Customer',
  fields: [
    {
      fieldname: 'name',
      label: 'Name',
      fieldtype: 'Data',
      required: true,
    },
    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      placeholder: 'john@thoe.com',
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      fieldtype: 'Data',
      placeholder: '9999999999',
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
      fieldtype: 'Float',
      required: true,
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Float',
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

export function getBaseMeta() {
  return {
    createdBy: 'Administrator',
    modifiedBy: 'Administrator',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };
}

export async function assertThrows(
  func: () => Promise<unknown>,
  message?: string
) {
  let threw = true;
  try {
    await func();
    threw = false;
  } catch {
  } finally {
    if (!threw) {
      throw new assert.AssertionError({
        message: `Missing expected exception${message ? `: ${message}` : ''}`,
      });
    }
  }
}

export async function assertDoesNotThrow(
  func: () => Promise<unknown>,
  message?: string
) {
  try {
    await func();
  } catch (err) {
    throw new assert.AssertionError({
      message: `Got unwanted exception${
        message ? `: ${message}` : ''
      }\nError: ${(err as Error).message}\n${(err as Error).stack}`,
    });
  }
}

export type BaseMetaKey = 'created' | 'modified' | 'createdBy' | 'modifiedBy';
