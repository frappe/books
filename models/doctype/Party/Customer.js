const { _ } = require('frappejs/utils');
const router = require('@/router').default;
const frappe = require('frappejs');

module.exports = {
  name: 'Customer',
  label: 'Customer',
  basedOn: 'Party',
  filters: {
    customer: 1
  },
  actions: [
    {
      label: _('Create Invoice'),
      action: async customer => {
        let doc = await frappe.getNewDoc('SalesInvoice');
        router.push({
          path: `/edit/SalesInvoice/${doc.name}`,
          query: {
            values: {
              customer: customer.name
            }
          }
        });
      }
    },
    {
      label: _('View Invoices'),
      action: customer => {
        router.push({
          path: `/list/SalesInvoice`,
          query: {
            filters: {
              customer: customer.name
            }
          }
        });
      }
    }
  ]
};
