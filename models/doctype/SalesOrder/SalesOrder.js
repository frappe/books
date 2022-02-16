import { t } from 'frappe';
import model from 'frappe/model';
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
  ],
});
