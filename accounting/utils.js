export const ledgerLink = {
  label: 'Ledger Entries',
  condition: (doc) => doc.submitted,
  action: (doc, router) => {
    router.push({
      name: 'Report',
      params: {
        reportName: 'general-ledger',
        defaultFilters: {
          referenceType: doc.doctype,
          referenceName: doc.name,
        },
      },
    });
  },
};

export default { ledgerLink };
