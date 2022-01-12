const title = 'GSTR 1';
import baseConfig from './BaseViewConfig';
import { generateGstr1Json, generateGstr1Csv } from '../../accounting/gst';

const transferTypeMap = {
  B2B: 'B2B',
  B2CL: 'B2C-Large',
  B2CS: 'B2C-Small',
  NR: 'Nil Rated, Exempted and Non GST supplies',
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
    label: 'JSON',
    type: 'primary',
    action: async (report, filters) => {
      generateGstr1Json(report, filters);
    },
  },
  {
    group: 'Export',
    label: 'CSV',
    type: 'primary',
    action: async (report, filters) => {
      generateGstr1Csv(report, filters);
    },
  },
]

export default {
  title: title,
  method: 'gstr-1',
  filterFields: [ transferType, ...baseConfig.filterFields],
  actions: actions,
  getColumns: baseConfig.getColumns,
};
