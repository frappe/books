const title = 'GSTR 1';
import baseConfig from './BaseViewConfig';
import { DateTime } from 'luxon';

const filterFields = baseConfig.filterFields;
filterFields.forEach((field) => {
  if (field.fieldname === 'toDate') {
    field.default = DateTime.local().toISODate();
  } 
  else if(field.fieldname === 'fromDate') {
    field.default = DateTime.local().minus({months: 3}).toISODate();
  }
});


export default {
  title: title,
  method: 'gstr-1',
  filterFields,
  linkFields: baseConfig.linkFields,
  getColumns: baseConfig.getColumns,
};
