import { t } from 'frappe';
import model from 'frappe/model';
import SalesInvoiceSettings from '../SalesInvoiceSettings/SalesInvoiceSettings';

export default model.extend(SalesInvoiceSettings, {
  name: 'QuotationSettings',
  label: t`Quotation Settings`,
  fields: [],
});
