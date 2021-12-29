const title = 'GSTR 2';
import baseConfig from './BaseViewConfig';
import { generateGstr2Csv } from '../../accounting/gst';

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
  filterFields: baseConfig.filterFields,
  actions: actions,
  getColumns: baseConfig.getColumns,
};
