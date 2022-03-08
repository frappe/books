import { t } from 'frappe';
import model from 'frappe/model';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';
import Quotation from '../Quotation/Quotation';

export default model.extend(Quotation, {
  name: 'Fulfillment',
  label: t`Fulfillment`,
  settings: 'FulfillmentSettings',
  fields: [
    {
      fieldname: 'items',
      childtype: 'FulfillmentItem',
    },
    {
      fieldname: 'numberSeries',
      label: t`Number Series`,
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      getFilters: () => {
        return { referenceType: 'Fulfillment' };
      },
      default: DEFAULT_NUMBER_SERIES['FulFillment'],
    },
  ],
});
