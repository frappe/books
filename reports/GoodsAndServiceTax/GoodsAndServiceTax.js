const frappe = require('frappejs');

class GoodsAndServiceTax {
  async run(params) {
    const filters = {};
    // if (params.account) filters.paymentAccount = params.account;
    // if (params.party) filters.party = params.party;
    // if (params.referenceType) filters.referenceType = params.referenceType;
    // if (params.referenceName) filters.referenceName = params.referenceName;
    // if (params.toDate || params.fromDate) {
    //   filters.date = [];
    //   if (params.toDate) filters.date.push('<=', params.toDate);
    //   if (params.fromDate) filters.date.push('>=', params.fromDate);
    // }
    if (params.name) filters.name = params.name;

    let listOfTaxes = await frappe.db.getAll({
      doctype: 'Tax',
    });

    for (let [pos, tax] of listOfTaxes.entries()) {
      let taxDetails = await frappe.getDoc('Tax', tax.name);
      listOfTaxes[pos].rate = taxDetails.details[0].rate;
    }
    return listOfTaxes;
  }
  
}

module.exports = GoodsAndServiceTax;
