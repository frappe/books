const title = 'GSTR 2';
import { t } from 'frappe';
import { generateGstr2Csv } from '../../accounting/gst';
import baseConfig from './BaseViewConfig';

const transferTypeMap = {
  B2B: 'B2B',
};

const transferType = {
  fieldtype: 'Select',
  label: t`Transfer Type`,
  placeholder: 'Transfer Type',
  fieldname: 'transferType',
  options: Object.keys(transferTypeMap),
  map: transferTypeMap,
  default: 'B2B',
  size: 'small',
};

const actions = [
  {
    group: 'Export',
    label: t`CSV`,
    type: 'primary',
    action: async (report, filters) => {
      generateGstr2Csv(report, filters);
    },
  },
];

export default {
  title: title,
  method: 'gstr-2',
  filterFields: [ transferType, ...baseConfig.filterFields],
  actions: actions,
  getColumns: baseConfig.getColumns,
};
