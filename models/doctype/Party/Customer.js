import router from '@/router';
import frappe, { t } from 'frappe';
import { h } from 'vue';
import PartyWidget from './PartyWidget.vue';

export default {
  name: 'Customer',
  label: t`Customer`,
  basedOn: 'Party',
  filters: {
    customer: 1,
  },
  actions: [
    {
      label: t`Create Invoice`,
      condition: (doc) => !doc.isNew(),
      action: async (customer) => {
        let doc = await frappe.getEmptyDoc('SalesInvoice');
        router.push({
          path: `/edit/SalesInvoice/${doc.name}`,
          query: {
            doctype: 'SalesInvoice',
            values: {
              customer: customer.name,
            },
          },
        });
      },
    },
    {
      label: t`View Invoices`,
      condition: (doc) => !doc.isNew(),
      action: (customer) => {
        router.push({
          name: 'ListView',
          params: {
            doctype: 'SalesInvoice',
            filters: {
              customer: customer.name,
            },
          },
        });
      },
    },
  ],
  quickEditWidget: (doc) => ({
    render() {
      return h(PartyWidget, {
        doc,
      });
    },
  }),
};
