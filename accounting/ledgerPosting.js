import frappe from 'frappe';

export default class LedgerPosting {
  constructor({ reference, party, date, description }) {
    this.reference = reference;
    this.party = party;
    this.date = date;
    this.description = description;
    this.entries = [];
    this.entryMap = {};
    this.reverted = 0;
    // To change balance while entering ledger entries
    this.accountEntries = [];
  }

  async debit(account, amount, referenceType, referenceName) {
    const entry = this.getEntry(account, referenceType, referenceName);
    entry.debit = entry.debit.add(amount);
    await this.setAccountBalanceChange(account, 'debit', amount);
  }

  async credit(account, amount, referenceType, referenceName) {
    const entry = this.getEntry(account, referenceType, referenceName);
    entry.credit = entry.credit.add(amount);
    await this.setAccountBalanceChange(account, 'credit', amount);
  }

  async setAccountBalanceChange(accountName, type, amount) {
    const debitAccounts = ['Asset', 'Expense'];
    const { rootType } = await frappe.getDoc('Account', accountName);
    if (debitAccounts.indexOf(rootType) === -1) {
      const change = type == 'credit' ? amount : amount.neg();
      this.accountEntries.push({
        name: accountName,
        balanceChange: change,
      });
    } else {
      const change = type == 'debit' ? amount : amount.neg();
      this.accountEntries.push({
        name: accountName,
        balanceChange: change,
      });
    }
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
        reverted: this.reverted,
        debit: frappe.pesa(0),
        credit: frappe.pesa(0),
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

    let data = await frappe.db.getAll({
      doctype: 'AccountingLedgerEntry',
      fields: ['name'],
      filters: {
        referenceName: this.reference.name,
        reverted: 0,
      },
    });

    for (let entry of data) {
      let entryDoc = await frappe.getDoc('AccountingLedgerEntry', entry.name);
      entryDoc.reverted = 1;
      await entryDoc.update();
    }

    let temp;
    for (let entry of this.entries) {
      temp = entry.debit;
      entry.debit = entry.credit;
      entry.credit = temp;
      entry.reverted = 1;
    }
    for (let entry of this.accountEntries) {
      entry.balanceChange = entry.balanceChange.neg();
    }
    await this.insertEntries();
  }

  makeRoundOffEntry() {
    let { debit, credit } = this.getTotalDebitAndCredit();
    let difference = debit.sub(credit);
    let absoluteValue = difference.abs();
    let allowance = 0.5;
    if (absoluteValue.eq(0)) {
      return;
    }

    let roundOffAccount = this.getRoundOffAccount();
    if (absoluteValue.lte(allowance)) {
      if (difference.gt(0)) {
        this.credit(roundOffAccount, absoluteValue);
      } else {
        this.debit(roundOffAccount, absoluteValue);
      }
    }
  }

  validateEntries() {
    let { debit, credit } = this.getTotalDebitAndCredit();
    if (debit.neq(credit)) {
      throw new Error(
        `Total Debit: ${frappe.format(
          debit,
          'Currency'
        )} must be equal to Total Credit: ${frappe.format(credit, 'Currency')}`
      );
    }
  }

  getTotalDebitAndCredit() {
    let debit = frappe.pesa(0);
    let credit = frappe.pesa(0);

    for (let entry of this.entries) {
      debit = debit.add(entry.debit);
      credit = credit.add(entry.credit);
    }

    return { debit, credit };
  }

  async insertEntries() {
    for (let entry of this.entries) {
      let entryDoc = frappe.newDoc({
        doctype: 'AccountingLedgerEntry',
      });
      Object.assign(entryDoc, entry);
      await entryDoc.insert();
    }
    for (let entry of this.accountEntries) {
      let entryDoc = await frappe.getDoc('Account', entry.name);
      entryDoc.balance = entryDoc.balance.add(entry.balanceChange);
      await entryDoc.update();
    }
  }

  getRoundOffAccount() {
    return frappe.AccountingSettings.roundOffAccount;
  }
}
