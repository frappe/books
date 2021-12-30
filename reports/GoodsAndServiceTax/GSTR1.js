import BaseGSTR from './BaseGSTR';

class GSTR1 extends BaseGSTR {
  async run(params) {
    if (!Object.keys(params).length) return [];

    let filters = {};
    filters.cancelled = 0;
    if (params.toDate || params.fromDate) {
      filters.date = [];

      if (params.place) filters.place = params.place;
      if (params.toDate) filters.date.push('<=', params.toDate);
      if (params.fromDate) filters.date.push('>=', params.fromDate);
    }

    const data = await this.getCompleteReport('GSTR-1', filters);

    // prettier-ignore
    const conditions = {
      'B2B': row => row.gstin,
      'B2CL': row => !row.gstin && !row.inState && row.invAmt >= 250000,
      'B2CS': row => !row.gstin && (row.inState || row.invAmt < 250000),
      'NR': row => (row.rate === 0), // this takes care of both nil rated, exempted goods
    };

    if (!params.transferType) return data;
    return data.filter((row) => conditions[params.transferType](row));
  }
}

export default GSTR1;
