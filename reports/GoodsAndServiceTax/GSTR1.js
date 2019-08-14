const BaseGSTR = require('./BaseGSTR');

class GSTR1 extends BaseGSTR {
  async run(params) {
    if (!Object.keys(params).length) return [];

    let filters = {};
    if (params.toDate || params.fromDate) {
      filters.date = [];
      if (params.toDate) filters.date.push('<=', params.toDate);
      if (params.fromDate) filters.date.push('>=', params.fromDate);
    }

    const data = await this.getCompleteReport('GSTR-1', filters);

    const conditions = {
      B2B: row => row.gstin,
      'B2C-Large': row => !row.gstin && !row.inState && row.invAmt >= 250000,
      'B2C-Small': row =>
        !row.gstin && (row.inState || (row.inState && row.invAmt < 250000))
    };

    if (!params.transferType) return data;
    return data.filter(row => conditions[params.transferType](row));
  }
}

module.exports = GSTR1;
