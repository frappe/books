const title = 'GSTR 2';
import baseConfig from './BaseViewConfig';

export default {
  title: title,
  method: 'gstr-2',
  filterFields: baseConfig.filterFields,
  actions: baseConfig.actions,
  getColumns: baseConfig.getColumns,
};
