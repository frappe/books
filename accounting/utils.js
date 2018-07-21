module.exports = {
  ledgerLink: {
    label: 'Ledger Entries',
    condition: form => form.doc.submitted,
    action: form => {
      form.$router.push({
        path: `/report/general-ledger?referenceType=${form.doc.doctype}&referenceName=${form.doc.name}`
      });
    }
  }
};
