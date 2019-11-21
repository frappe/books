import { _ } from 'frappejs/utils';
import Badge from '@/components/Badge';

export default {
  doctype: 'PurchaseInvoice',
  title: _('Purchase Invoice'),
  formRoute: name => `/edit/PurchaseInvoice/${name}`,
  columns: [
    'supplier',
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
