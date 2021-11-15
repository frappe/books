import model from 'frappejs/model';
import PurchaseOrderItem from '../PurchaseOrderItem/PurchaseOrderItem';

export default model.extend(PurchaseOrderItem, {
    name: "PurchaseReceiptItem",
    fields: [
        {
            "fieldname": "acceptedQuantity",
            "label": "Accepted Quantity",
            "fieldtype": "Float",
            "required": 1
        }
    ]
}, {
    skipFields: ['expenseAccount']
});
