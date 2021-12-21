const title = 'GSTR 1';
import baseConfig from './BaseViewConfig';

export default {
  title: title,
  method: 'gstr-1',
  filterFields: baseConfig.filterFields,
  actions: baseConfig.actions,
  getColumns: baseConfig.getColumns,
};
