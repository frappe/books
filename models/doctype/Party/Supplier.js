const { _ } = require('frappejs/utils');
const router = require('@/router').default;
const frappe = require('frappejs');
const PartyWidget = require('./PartyWidget.vue').default;

module.exports = {
  name: 'Supplier',
  label: 'Supplier',
  basedOn: 'Party',
  filters: {
    supplier: 1
  },
  actions: [
    {
      label: _('Create Bill'),
      condition: doc => !doc.isNew(),
      action: async supplier => {
        let doc = await frappe.getNewDoc('PurchaseInvoice');
        router.push({
          path: `/edit/PurchaseInvoice/${doc.name}`,
          query: {
            doctype: 'PurchaseInvoice',
            values: {
              supplier: supplier.name
            }
          }
        });
      }
    },
    {
      label: _('View Bills'),
      condition: doc => !doc.isNew(),
      action: supplier => {
        router.push({
          name: 'ListView',
          params: {
            doctype: 'PurchaseInvoice',
            filters: {
              supplier: supplier.name
            }
          }
        });
      }
    }
  ],
  quickEditWidget: doc => ({
    render(h) {
      return h(PartyWidget, {
        props: { doc }
      });
    }
  })
};
