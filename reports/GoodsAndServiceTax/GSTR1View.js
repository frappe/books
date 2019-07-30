const title = 'GSTR 1';
const baseConfig = require('./BaseViewConfig');
module.exports = {
  title: title,
  method: 'gstr-1',
  filterFields: baseConfig.filterFields,
  linkFields: baseConfig.linkFields,
  getColumns: baseConfig.getColumns
};
