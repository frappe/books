import { t } from 'frappe';
import model from 'frappe/model';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';
import Quotation from '../Quotation/Quotation';

export default model.extend(Quotation, {
  name: 'SalesOrder',
  label: t`Sales Order`,
  settings: 'SalesOrderSettings',
  fields: [
    {
      fieldname: 'items',
      childtype: 'SalesOrderItem',
    },
    {
      fieldname: 'numberSeries',
      label: t`Number Series`,
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      getFilters: () => {
        return { referenceType: 'SalesOrder' };
      },
      default: DEFAULT_NUMBER_SERIES['SalesOrder'],
    },
  ],
});
