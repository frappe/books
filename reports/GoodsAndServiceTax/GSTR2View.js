const title = 'GSTR 2';
import baseConfig from './BaseViewConfig';

export default {
  title: title,
  method: 'gstr-2',
  filterFields: baseConfig.filterFields,
  linkFields: baseConfig.linkFields,
  getColumns: baseConfig.getColumns,
};
