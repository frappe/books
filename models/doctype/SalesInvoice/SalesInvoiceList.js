import { _ } from 'frappejs/utils';
import Badge from '@/components/Badge';

export default {
  doctype: 'SalesInvoice',
  title: _('Sales Invoices'),
  formRoute: name => `/edit/SalesInvoice/${name}`,
  columns: [
    'customer',
    'name',
    {
      label: 'Status',
      fieldname: 'status',
      fieldtype: 'Select',
      size: 'small',
      render(doc) {
        let status = 'Pending';
        let color = 'orange';
        if (doc.submitted === 1 && doc.outstandingAmount === 0.0) {
          status = 'Paid';
          color = 'green';
        }
        return {
          template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
          components: { Badge }
        };
      }
    },
    'date',
    'grandTotal',
    'outstandingAmount'
  ]
};
