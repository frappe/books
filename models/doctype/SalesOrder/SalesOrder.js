import model from 'frappejs/model';
import Quotation from '../Quotation/Quotation';

export default model.extend(Quotation, {
  name: 'SalesOrder',
  label: 'Sales Order',
  settings: 'SalesOrderSettings',
  fields: [
    {
      fieldname: 'items',
      childtype: 'SalesOrderItem'
    }
  ]
});
