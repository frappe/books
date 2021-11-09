import model from 'frappejs/model';
import QuotationSettings from '../QuotationSettings/QuotationSettings';

export default model.extend(QuotationSettings, {
    "name": "FulfillmentSettings",
    "label": "Fulfillment Settings",
    "fields": [
        {
            "fieldname": "numberSeries",
            "default": "OF"
        }
    ]
});
