import frappe from 'frappejs';
import utils from '../../../accounting/utils';
import { openQuickEdit, getInvoiceStatus, statusColor } from '@/utils';
import Badge from '@/components/Badge';

export function getStatusColumn() {
  return {
    label: 'Status',
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      const status = getInvoiceStatus(doc);
      const color = statusColor[status];
      return {
        template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
        components: { Badge }
      };
    }
  };
}

export function getActions(doctype) {
  return [
    {
      label: 'Make Payment',
      condition: doc => doc.submitted && doc.outstandingAmount > 0,
      action: async function makePayment(doc) {
        let payment = await frappe.getNewDoc('Payment');
        payment.once('afterInsert', async () => {
          await payment.submit();
        });
        let isSales = doctype === 'SalesInvoice';
        let party = isSales ? doc.customer : doc.supplier;
        let paymentType = isSales ? 'Receive' : 'Pay';
        let hideAccountField = isSales ? 'account' : 'paymentAccount';
        openQuickEdit({
          doctype: 'Payment',
          name: payment.name,
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
                amount: doc.outstandingAmount
              }
            ]
          }
        });
      }
    },
    {
      label: 'Revert',
      condition: doc =>
        doc.submitted && doc.baseGrandTotal === doc.outstandingAmount,
      action(doc) {
        doc.revert();
      }
    },
    {
      label: 'Print',
      condition: doc => doc.submitted,
      action(doc, router) {
        router.push(`/print/${doc.doctype}/${doc.name}`);
      }
    },
    utils.ledgerLink
  ];
}

export default {
  getStatusColumn,
  getActions,
};
