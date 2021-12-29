const title = 'GSTR 1';
import baseConfig from './BaseViewConfig';
import { generateGstr1Json } from '../../accounting/gst';

const actions = [
  {
    group: 'Export',
    label: 'JSON',
    type: 'primary',
    action: async (report, filters) => {
      generateGstr1Json(report, filters);
    },
  },
]

export default {
  title: title,
  method: 'gstr-1',
  filterFields: baseConfig.filterFields,
  actions: actions,
  getColumns: baseConfig.getColumns,
};
