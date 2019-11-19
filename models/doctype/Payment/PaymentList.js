import { _ } from 'frappejs/utils';
import Badge from '@/components/Badge';

export default {
  doctype: 'Payment',
  title: _('Payments'),
  columns: [
    'party',
    {
      label: 'Status',
      fieldname: 'status',
      fieldtype: 'Select',
      size: 'small',
      render(doc) {
        let status = 'Not Reconciled';
        let color = 'orange';
        if (
          doc.submitted === 1 &&
          (doc.clearanceDate !== null || doc.paymentMethod === 'Cash')
        ) {
          color = 'green';
          status = 'Reconciled';
        }

        return {
          template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
          components: { Badge }
        };
      }
    },
    'paymentType',
    'date',
    'amount'
  ]
};
