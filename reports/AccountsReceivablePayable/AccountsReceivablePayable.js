const frappe = require('frappejs');

module.exports = class AccountsReceivablePayable {
    async run(reportType, { date }) {

        const rows = await getReceivablePayable({
            reportType,
            date
        });

        return { rows };
    }
}

async function getReceivablePayable({ reportType = 'Receivable', date }) {
    let entries = [];
    const debitOrCredit = reportType === 'Receivable' ? 'debit' : 'credit';
    const referenceType = reportType === 'Receivable' ? 'Invoice' : 'Bill';

    entries = await getLedgerEntries();
    const vouchers = await getVouchers();

    const futureEntries = getFutureEntries();
    const returnEntries = getReturnEntries();
    const pdc = getPDC();

    const validEntries = getValidEntries();

    let data = [];

    for (let entry of validEntries) {
        // console.log(entry);

        const { outStandingAmount, creditNoteAmount } = getOutstandingAmount(entry);

        console.log(outStandingAmount);

        if (outStandingAmount > 0.1 / 10) {
            const row = {
                date: entry.date,
                party: entry.party
            };

            // due date / bill date

            row.voucherType = entry.referenceType;
            row.voucherNo = entry.referenceName;

            // bill details

            const invoicedAmount = entry[debitOrCredit] || 0;
            const paidAmount = invoicedAmount - outStandingAmount - creditNoteAmount;

            Object.assign(row, {
                invoicedAmount,
                paidAmount,
                outStandingAmount,
                creditNoteAmount
            });

            // ageing

            data.push(row);
        }
    }

    return data;

    // helpers

    async function getVouchers() {
        return await frappe.db.getAll({
            doctype: referenceType,
            fields: ['name', 'date'],
            filters: {
                submitted: 1
            }
        });
    }

    function getValidEntries() {
        return entries.filter(entry => {
            return (
                entry.date <= date &&
                entry.referenceType === referenceType && entry[debitOrCredit] > 0
            );
        });
    }

    function getOutstandingAmount(entry) {
        let paymentAmount = 0.0, creditNoteAmount = 0.0;
        let reverseDebitOrCredit = debitOrCredit === 'debit' ? 'credit' : 'debit';

        for (let e of getEntriesFor(entry.party, entry.referenceType, entry.referenceName)) {
            if (e.date <= date) {
                const amount = e[reverseDebitOrCredit] - e[debitOrCredit];

                if (!Object.keys(returnEntries).includes(e.referenceName)) {
                    paymentAmount += amount;
                } else {
                    creditNoteAmount += amount;
                }
            }
        }

        return {
            outStandingAmount: (entry[debitOrCredit] - entry[reverseDebitOrCredit]) - paymentAmount - creditNoteAmount,
            creditNoteAmount
        }
    }

    function getEntriesFor(party, againstVoucherType, againstVoucher) {
        // TODO
        return []
    }

    function getFutureEntries() {
        return entries.filter(entry => entry.date > date);
    }

    function getReturnEntries() {
        // TODO
        return {};
    }

    function getPDC() {
        return [];
    }

    async function getLedgerEntries() {
        if (entries.length) {
            return entries;
        }

        const partyType = reportType === 'Receivable' ? 'customer': 'supplier'
        const partyList = (await frappe.db.getAll({
            doctype: 'Party',
            filters: {
                [partyType]: 1
            }
        })).map(d => d.name);

        return await frappe.db.getAll({
            doctype: 'AccountingLedgerEntry',
            fields: ['name', 'date', 'account', 'party',
                'referenceType', 'referenceName',
                'sum(debit) as debit', 'sum(credit) as credit'],
            filters: {
                party: ['in', partyList]
            },
            groupBy: ['referenceType', 'referenceName', 'party'],
            orderBy: 'date'
        });
    }
}
