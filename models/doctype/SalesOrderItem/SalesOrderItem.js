import model from 'frappe/model';
import QuotationItem from '../QuotationItem/QuotationItem';

export default model.extend(QuotationItem, {
  name: 'SalesOrderItem',
});
