import router from '@/router';
import frappe from 'frappe';
import { t } from 'frappe';
import PartyWidget from './PartyWidget.vue';

export default {
  name: 'Supplier',
  label: 'Supplier',
  basedOn: 'Party',
  filters: {
    supplier: 1,
  },
  actions: [
    {
      label: t('Create Bill'),
      condition: (doc) => !doc.isNew(),
      action: async (supplier) => {
        let doc = await frappe.getNewDoc('PurchaseInvoice');
        router.push({
          path: `/edit/PurchaseInvoice/${doc.name}`,
          query: {
            doctype: 'PurchaseInvoice',
            values: {
              supplier: supplier.name,
            },
          },
        });
      },
    },
    {
      label: t('View Bills'),
      condition: (doc) => !doc.isNew(),
      action: (supplier) => {
        router.push({
          name: 'ListView',
          params: {
            doctype: 'PurchaseInvoice',
            filters: {
              supplier: supplier.name,
            },
          },
        });
      },
    },
  ],
  quickEditWidget: (doc) => ({
    render(h) {
      return h(PartyWidget, {
        props: { doc },
      });
    },
  }),
};
