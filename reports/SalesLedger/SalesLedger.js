const frappe = require('frappejs');

class SalesLedger {
    async run(params) {

        let filters = {};

        if (params.toDate || params.fromDate) {
            filters.date = [];
            if (params.toDate) filters.date.push('<=', params.toDate);
            if (params.fromDate) filters.date.push('>=', params.fromDate);
        }

        if(params.customer) {
            filters.customer = params.customer;
        }

        function checkExistance(key, value, array) {
            let arrayItem;
            for(arrayItem of array) {
                if (arrayItem[key] == value) {
                    return true;
                }
            };
            return false;
        }

        async function getFulfillmentEntries(salesEntriesItems) {
            let fulfillmentEntriesItemsDetails = await frappe.db.getAll({
                doctype: 'FulfillmentItem',
                fields: ['*'],
                orderBy: 'name',
                order: 'asc',
            });
            return fulfillmentEntriesItemsDetails.filter(function (fI) {
                let condition = checkExistance("salesOrderID", fI.salesOrder, salesEntriesItems);
                fI.salesOrderID = fI.salesOrder;
                return condition;
            });
        }

        function getSalesOrderStatus(deliveredPercent) {
            let status;
            switch (deliveredPercent) {
                case 0:
                    status = "Not Delivered";
                    break;
                case 100:
                    status = "Fully Delivered";
                    break;
                default:
                    status = "Partially Delivered";
                    break;
            }
            return status;
        }

        async function populateSalesEntries(...salesData) {
            let [salesEntriesItems, salesEntriesItemsDetails] = salesData;
            let fulfillmentEntriesItemsDetails = await getFulfillmentEntries(salesEntriesItems);
            return salesEntriesItems.map(function (seI) {
                let salesEntryItems = salesEntriesItemsDetails.filter(function(sI) {
                    return (sI.parent == seI.salesOrderID);
                });
                let fulfillmentEntryItems = fulfillmentEntriesItemsDetails.filter(function(fI) {
                    return (fI.salesOrderID == seI.salesOrderID);
                });
                seI.noItemsOrdered = salesEntryItems.reduce(function (acc, sI) {
                    return (acc + sI.quantity);
                }, 0);
                seI.noItemsDelivered = fulfillmentEntryItems.reduce(function(acc, fI) {
                    return (acc + fI.quantity);
                }, 0);
                seI.deliveredPercent = `${Math.round((seI.noItemsDelivered * 100) / seI.noItemsOrdered)}%`;
                seI.noItemsRemaining = seI.noItemsOrdered - seI.noItemsDelivered;
                seI.status = getSalesOrderStatus(seI.deliveredPercent);
                return seI;
            });
        }

        async function getSalesOrderItems(salesEntriesItems, salesEntries) {
            let salesEntriesItemsDetails = await frappe.db.getAll({
                doctype: 'SalesOrderItem',
                fields: ['*'],
                orderBy: 'name',
                order: 'asc',
            });
            return populateSalesEntries(
                salesEntriesItems,
                salesEntriesItemsDetails,
            );
        }

        async function getSalesOrderEntries(filters) {
            let salesEntries = await frappe.db.getAll({
                doctype: 'SalesOrder',
                fields: ["*"],
                filters: filters
            });
            let salesEntriesItems = [];
            salesEntries.forEach(function(salesEntry) {
                salesEntriesItems.push({
                    salesOrderID : salesEntry.name,
                    date: salesEntry.date,
                    customer: salesEntry.customer
                });
            });
            salesEntriesItems =  await getSalesOrderItems(salesEntriesItems, salesEntries);
            if(!(!(params.status) || params.status == "Any")) {
                return salesEntriesItems.filter(function(seI) {
                    return (seI.status == params.status);
                });
            }
            return salesEntriesItems;
        }

        let data = await getSalesOrderEntries(filters);
        return data;
    }
}

module.exports = SalesLedger;