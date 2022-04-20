import { t } from 'fyo';
import Avatar from 'src/components/Avatar.vue';
import { fyo } from 'src/initFyo';
import getCommonExportActions from '../commonExporter';

export function getPartyWithAvatar(partyName) {
  return {
    data() {
      return {
        imageURL: null,
        label: null,
      };
    },
    components: {
      Avatar,
    },
    async mounted() {
      const p = await fyo.db.get('Party', partyName);
      this.imageURL = p.image;
      this.label = partyName;
    },
    template: `
      <div class="flex items-center" v-if="label">
        <Avatar class="flex-shrink-0" :imageURL="imageURL" :label="label" size="sm" />
        <span class="ml-2 truncate">{{ label }}</span>
      </div>
    `,
  };
}

let title = t`General Ledger`;

const viewConfig = {
  title,
  filterFields: [
    {
      fieldtype: 'Select',
      options: [
        { label: t`All References`, value: 'All' },
        { label: t`Invoices`, value: 'SalesInvoice' },
        { label: t`Bills`, value: 'PurchaseInvoice' },
        { label: t`Payment`, value: 'Payment' },
        { label: t`Journal Entry`, value: 'JournalEntry' },
      ],
      size: 'small',
      label: t`Reference Type`,
      fieldname: 'referenceType',
      placeholder: t`Reference Type`,
      default: 'All',
    },
    {
      fieldtype: 'DynamicLink',
      size: 'small',
      placeholder: t`Reference Name`,
      references: 'referenceType',
      label: t`Reference Name`,
      fieldname: 'referenceName',
    },
    {
      fieldtype: 'Link',
      target: 'Account',
      size: 'small',
      placeholder: t`Account`,
      label: t`Account`,
      fieldname: 'account',
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      label: t`Party`,
      size: 'small',
      placeholder: t`Party`,
      fieldname: 'party',
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: t`From Date`,
      label: t`From Date`,
      fieldname: 'fromDate',
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: t`To Date`,
      label: t`To Date`,
      fieldname: 'toDate',
    },
    {
      fieldtype: 'Check',
      size: 'small',
      default: 0,
      label: t`Cancelled`,
      fieldname: 'reverted',
    },
  ],
  method: 'general-ledger',
  actions: getCommonExportActions('general-ledger'),
  getColumns() {
    return [
      {
        label: t`Account`,
        fieldtype: 'Link',
        fieldname: 'account',
        width: 1.5,
      },
      {
        label: t`Date`,
        fieldtype: 'Date',
        fieldname: 'date',
        width: 0.75,
      },
      {
        label: t`Debit`,
        fieldtype: 'Currency',
        fieldname: 'debit',
        width: 1.25,
      },
      {
        label: t`Credit`,
        fieldtype: 'Currency',
        fieldname: 'credit',
        width: 1.25,
      },
      {
        label: t`Balance`,
        fieldtype: 'Currency',
        fieldname: 'balance',
        width: 1.25,
      },
      {
        label: t`Reference Type`,
        fieldtype: 'Data',
        fieldname: 'referenceType',
      },
      {
        label: t`Reference Name`,
        fieldtype: 'Data',
        fieldname: 'referenceName',
      },
      {
        label: t`Party`,
        fieldtype: 'Link',
        fieldname: 'party',
        component(cellValue) {
          return getPartyWithAvatar(cellValue);
        },
      },
    ];
  },
};

export default viewConfig;
