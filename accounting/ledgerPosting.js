const frappe = require('frappejs');

module.exports = class LedgerPosting {
    constructor({reference, party, date, description}) {
        Object.assign(this, arguments[0]);
        this.entries = [];
        this.entryMap = {};
    }

    debit(account, amount, referenceType, referenceName) {
        const entry = this.getEntry(account, referenceType, referenceName);
        entry.debit += amount;
    }

    credit(account, amount, referenceType, referenceName) {
        const entry = this.getEntry(account, referenceType, referenceName);
        entry.credit += amount;
    }

    getEntry(account, referenceType, referenceName) {
        if (!this.entryMap[account]) {
            const entry = {
                account: account,
                party: this.party || '',
                date: this.date || this.reference.date,
                referenceType: referenceType || this.reference.doctype,
                referenceName: referenceName || this.reference.name,
                description: this.description,
                debit: 0,
                credit: 0
            };

            this.entries.push(entry);
            this.entryMap[account] = entry;
        }

        return this.entryMap[account];
    }

    async post() {
        this.validateEntries();
        await this.insertEntries();
    }

    async postReverse() {
        this.validateEntries();
        let temp;
        for (let entry of this.entries) {
            temp = entry.debit;
            entry.debit = entry.credit;
            entry.credit = temp;
        }
        await this.insertEntries();
    }

    validateEntries() {
        let debit = 0, credit = 0;
        let debitAccounts = [], creditAccounts = [];
        for (let entry of this.entries) {
            debit += entry.debit;
            credit += entry.credit;
            if (debit) {
                debitAccounts.push(entry.account);
            } else {
                creditAccounts.push(entry.account);
            }
        }

        if (debit !== credit) {
            throw frappe.errors.ValidationError(frappe._("Debit {0} must be equal to Credit {1}", [debit, credit]));
        }
    }

    async insertEntries() {
        for (let entry of this.entries) {
            let entryDoc = frappe.newDoc({
                doctype: 'AccountingLedgerEntry'
            });
            Object.assign(entryDoc, entry);
            await entryDoc.insert();
        }
    }
}