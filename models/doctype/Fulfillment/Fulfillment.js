import model from 'frappejs/model';
import Quotation from '../Quotation/Quotation';

export default model.extend(Quotation, {
    name: "Fulfillment",
    label: "Fulfillment",
    settings: "FulfillmentSettings",
    fields: [
        {
            "fieldname": "items",
            "childtype": "FulfillmentItem"
        }
    ]
});
