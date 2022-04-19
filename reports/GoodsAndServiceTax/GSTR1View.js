const title = 'GSTR 1';
import { t } from 'fyo';
import { generateGstr1Csv, generateGstr1Json } from '../../accounting/gst';
import baseConfig from './BaseViewConfig';

const transferTypeMap = {
  B2B: 'B2B',
  B2CL: 'B2C-Large',
  B2CS: 'B2C-Small',
  NR: 'Nil Rated, Exempted and Non GST supplies',
};

const transferType = {
  fieldtype: 'Select',
  label: t`Transfer Type`,
  placeholder: t`Transfer Type`,
  fieldname: 'transferType',
  options: Object.keys(transferTypeMap),
  map: transferTypeMap,
  default: 'B2B',
  size: 'small',
};

const actions = [
  {
    group: t`Export`,
    label: t`JSON`,
    type: 'primary',
    action: async (report, filters) => {
      generateGstr1Json(report, filters);
    },
  },
  {
    group: t`Export`,
    label: t`CSV`,
    type: 'primary',
    action: async (report, filters) => {
      generateGstr1Csv(report, filters);
    },
  },
];

export default {
  title: title,
  method: 'gstr-1',
  filterFields: [ transferType, ...baseConfig.filterFields],
  actions: actions,
  getColumns: baseConfig.getColumns,
};
