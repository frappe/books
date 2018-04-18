module.exports = {
    ledgerLink: {
        label: 'Ledger Entries',
        condition: form => form.doc.submitted,
        action: form => {
            return {
                route: ['report', 'general-ledger'],
                params: {
                    referenceType: form.doc.doctype,
                    referenceName: form.doc.name
                }
            };
        }
    },
}