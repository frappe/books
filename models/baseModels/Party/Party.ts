import frappe from 'frappe';
import Doc from 'frappe/model/doc';
import {
  Action,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
} from 'frappe/model/types';
import { PartyRole } from './types';

export class Party extends Doc {
  async updateOutstandingAmount() {
    const role = this.role as PartyRole;
    switch (role) {
      case 'Customer':
        await this._updateOutstandingAmount('SalesInvoice');
        break;
      case 'Supplier':
        await this._updateOutstandingAmount('PurchaseInvoice');
        break;
      case 'Both':
        await this._updateOutstandingAmount('SalesInvoice');
        await this._updateOutstandingAmount('PurchaseInvoice');
        break;
    }
  }

  async _updateOutstandingAmount(
    schemaName: 'SalesInvoice' | 'PurchaseInvoice'
  ) {
    const outstandingAmounts = (
      await frappe.db.getAllRaw(schemaName, {
        fields: ['outstandingAmount', 'party'],
        filters: { submitted: true },
      })
    ).filter(({ party }) => party === this.name);

    const totalOutstanding = outstandingAmounts
      .map(({ outstandingAmount }) => frappe.pesa(outstandingAmount as number))
      .reduce((a, b) => a.add(b), frappe.pesa(0));

    await this.set('outstandingAmount', totalOutstanding);
    await this.update();
  }

  formulas: FormulaMap = {
    defaultAccount: async () => {
      const role = this.role as PartyRole;
      if (role === 'Both') {
        return '';
      }

      let accountName = 'Debtors';
      if (role === 'Supplier') {
        accountName = 'Creditors';
      }

      const accountExists = await frappe.db.exists('Account', accountName);
      return accountExists ? accountName : '';
    },
    currency: async () => frappe.singles.AccountingSettings!.currency as string,
    addressDisplay: async () => {
      const address = this.address as string | undefined;
      if (address) {
        return this.getFrom('Address', address, 'addressDisplay') as string;
      }
      return '';
    },
  };

  static filters: FiltersMap = {
    defaultAccount: (doc: Doc) => {
      const role = doc.role as PartyRole;
      if (role === 'Both') {
        return {
          isGroup: false,
          accountType: ['in', ['Payable', 'Receivable']],
        };
      }

      return {
        isGroup: false,
        accountType: role === 'Customer' ? 'Receivable' : 'Payable',
      };
    },
  };

  static listSettings: ListViewSettings = {
    columns: ['name', 'phone', 'outstandingAmount'],
  };

  static actions: Action[] = [
    {
      label: frappe.t`Create Bill`,
      condition: (doc: Doc) =>
        !doc.isNew && (doc.role as PartyRole) !== 'Customer',
      action: async (partyDoc, router) => {
        const doc = await frappe.doc.getEmptyDoc('PurchaseInvoice');
        router.push({
          path: `/edit/PurchaseInvoice/${doc.name}`,
          query: {
            doctype: 'PurchaseInvoice',
            values: {
              // @ts-ignore
              party: partyDoc.name!,
            },
          },
        });
      },
    },
    {
      label: frappe.t`View Bills`,
      condition: (doc: Doc) =>
        !doc.isNew && (doc.role as PartyRole) !== 'Customer',
      action: async (partyDoc, router) => {
        router.push({
          name: 'ListView',
          params: {
            doctype: 'PurchaseInvoice',
            filters: {
              // @ts-ignore
              party: partyDoc.name!,
            },
          },
        });
      },
    },
    {
      label: frappe.t`Create Invoice`,
      condition: (doc: Doc) =>
        !doc.isNew && (doc.role as PartyRole) !== 'Supplier',
      action: async (partyDoc, router) => {
        const doc = await frappe.doc.getEmptyDoc('SalesInvoice');
        router.push({
          path: `/edit/SalesInvoice/${doc.name}`,
          query: {
            doctype: 'SalesInvoice',
            values: {
              // @ts-ignore
              party: partyDoc.name!,
            },
          },
        });
      },
    },
    {
      label: frappe.t`View Invoices`,
      condition: (doc: Doc) =>
        !doc.isNew && (doc.role as PartyRole) !== 'Supplier',
      action: async (partyDoc, router) => {
        router.push({
          name: 'ListView',
          params: {
            doctype: 'SalesInvoice',
            filters: {
              // @ts-ignore
              party: partyDoc.name!,
            },
          },
        });
      },
    },
  ];
}
