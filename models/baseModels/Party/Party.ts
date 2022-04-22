import { Fyo } from 'fyo';
import Doc from 'fyo/model/doc';
import {
  Action,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
  ValidationMap,
} from 'fyo/model/types';
import {
  validateEmail,
  validatePhoneNumber,
} from 'fyo/model/validationFunction';
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
      await this.fyo.db.getAllRaw(schemaName, {
        fields: ['outstandingAmount', 'party'],
        filters: { submitted: true },
      })
    ).filter(({ party }) => party === this.name);

    const totalOutstanding = outstandingAmounts
      .map(({ outstandingAmount }) =>
        this.fyo.pesa(outstandingAmount as number)
      )
      .reduce((a, b) => a.add(b), this.fyo.pesa(0));

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

      const accountExists = await this.fyo.db.exists('Account', accountName);
      return accountExists ? accountName : '';
    },
    currency: async () =>
      this.fyo.singles.AccountingSettings!.currency as string,
    addressDisplay: async () => {
      const address = this.address as string | undefined;
      if (address) {
        return this.getFrom('Address', address, 'addressDisplay') as string;
      }
      return '';
    },
  };

  validations: ValidationMap = {
    email: validateEmail,
    phone: validatePhoneNumber,
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

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'phone', 'outstandingAmount'],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    return [
      {
        label: fyo.t`Create Bill`,
        condition: (doc: Doc) =>
          !doc.isNew && (doc.role as PartyRole) !== 'Customer',
        action: async (partyDoc, router) => {
          const doc = await fyo.doc.getEmptyDoc('PurchaseInvoice');
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
        label: fyo.t`View Bills`,
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
        label: fyo.t`Create Invoice`,
        condition: (doc: Doc) =>
          !doc.isNew && (doc.role as PartyRole) !== 'Supplier',
        action: async (partyDoc, router) => {
          const doc = await fyo.doc.getEmptyDoc('SalesInvoice');
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
        label: fyo.t`View Invoices`,
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
}
