import { Frappe } from 'frappe';
import Doc from 'frappe/model/doc';
import { Action, ColumnConfig } from 'frappe/model/types';
import Money from 'pesa/dist/types/src/money';
import { Router } from 'vue-router';
import { InvoiceStatus } from './types';

export function getLedgerLinkAction(frappe: Frappe): Action {
  return {
    label: frappe.t`Ledger Entries`,
    condition: (doc: Doc) => !!doc.submitted,
    action: async (doc: Doc, router: Router) => {
      router.push({
        name: 'Report',
        params: {
          reportName: 'general-ledger',
          defaultFilters: {
            // @ts-ignore
            referenceType: doc.schemaName,
            referenceName: doc.name,
          },
        },
      });
    },
  };
}

export function getTransactionActions(
  schemaName: string,
  frappe: Frappe
): Action[] {
  return [
    {
      label: frappe.t`Make Payment`,
      condition: (doc: Doc) =>
        (doc.submitted as boolean) && (doc.outstandingAmount as Money).gt(0),
      action: async function makePayment(doc: Doc) {
        const payment = await frappe.doc.getEmptyDoc('Payment');
        payment.once('afterInsert', async () => {
          await payment.submit();
        });
        const isSales = schemaName === 'SalesInvoice';
        const party = isSales ? doc.customer : doc.supplier;
        const paymentType = isSales ? 'Receive' : 'Pay';
        const hideAccountField = isSales ? 'account' : 'paymentAccount';

        const { openQuickEdit } = await import('../src/utils');
        await openQuickEdit({
          schemaName: 'Payment',
          name: payment.name as string,
          hideFields: ['party', 'date', hideAccountField, 'paymentType', 'for'],
          defaults: {
            party,
            [hideAccountField]: doc.account,
            date: new Date().toISOString().slice(0, 10),
            paymentType,
            for: [
              {
                referenceType: doc.doctype,
                referenceName: doc.name,
                amount: doc.outstandingAmount,
              },
            ],
          },
        });
      },
    },
    {
      label: frappe.t`Print`,
      condition: (doc: Doc) => doc.submitted as boolean,
      action: async (doc: Doc, router: Router) => {
        router.push({ path: `/print/${doc.doctype}/${doc.name}` });
      },
    },
    getLedgerLinkAction(frappe),
  ];
}

export function getTransactionStatusColumn(frappe: Frappe): ColumnConfig {
  const statusMap = {
    Unpaid: frappe.t`Unpaid`,
    Paid: frappe.t`Paid`,
    Draft: frappe.t`Draft`,
    Cancelled: frappe.t`Cancelled`,
  };

  return {
    label: frappe.t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc: Doc) {
      const status = getInvoiceStatus(doc) as InvoiceStatus;
      const color = statusColor[status];
      const label = statusMap[status];
      return {
        template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
      };
    },
  };
}

export const statusColor = {
  Draft: 'gray',
  Unpaid: 'orange',
  Paid: 'green',
  Cancelled: 'red',
};

export function getInvoiceStatus(doc: Doc) {
  let status = `Unpaid`;
  if (!doc.submitted) {
    status = 'Draft';
  }

  if (doc.submitted && (doc.outstandingAmount as Money).isZero()) {
    status = 'Paid';
  }

  if (doc.cancelled) {
    status = 'Cancelled';
  }
  return status;
}
