const title = 'GSTR 2';
const baseConfig = require('./BaseViewConfig');
module.exports = {
  title: title,
  method: 'gstr-2',
  filterFields: baseConfig.filterFields,
  linkFields: baseConfig.linkFields,
  getColumns: baseConfig.getColumns
};
