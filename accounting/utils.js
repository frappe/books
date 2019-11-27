let router = require('@/router').default;

module.exports = {
  ledgerLink: {
    label: 'Ledger Entries',
    condition: doc => doc.submitted,
    action: doc => {
      router.push({
        name: 'Report',
        params: {
          reportName: 'general-ledger',
          defaultFilters: {
            referenceType: doc.doctype,
            referenceName: doc.name
          }
        }
      });
    }
  }
};
