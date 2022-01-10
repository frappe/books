const title = 'GSTR 2';
import baseConfig from './BaseViewConfig';
import { generateGstr2Csv } from '../../accounting/gst';

const transferTypeMap = {
  B2B: 'B2B',
};

const transferType = {
  fieldtype: 'Select',
  label: 'Transfer Type',
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
    label: 'CSV',
    type: 'primary',
    action: async (report, filters) => {
      generateGstr2Csv(report, filters);
    },
  },
]

export default {
  title: title,
  method: 'gstr-2',
  filterFields: [ transferType, ...baseConfig.filterFields],
  actions: actions,
  getColumns: baseConfig.getColumns,
};
