import model from 'frappe/model';
import SalesInvoiceItem from '../SalesInvoiceItem/SalesInvoiceItem';

export default model.extend(SalesInvoiceItem, {
  name: 'QuotationItem',
});
