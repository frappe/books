import Badge from '@/components/Badge';
import { t } from 'frappe';

export default {
  doctype: 'Payment',
  title: t('Payments'),
  columns: [
    'party',
    {
      label: 'Status',
      fieldname: 'status',
      fieldtype: 'Select',
      size: 'small',
      render(doc) {
        let status = 'Draft';
        let color = 'gray';
        if (
          doc.submitted === 1 &&
          (doc.clearanceDate !== null || doc.paymentMethod === 'Cash')
        ) {
          color = 'green';
          status = 'Submitted';
        }
        if (doc.cancelled === 1) {
          color = 'red';
          status = 'Cancelled';
        }

        return {
          template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
          components: { Badge },
        };
      },
    },
    'paymentType',
    'date',
    'amount',
  ],
};
