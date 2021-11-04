import frappe from 'frappejs';
import { round } from 'frappejs/utils/numberFormat';

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
    entry.debit += amount;
    await this.setAccountBalanceChange(account, 'debit', amount);
  }

  async credit(account, amount, referenceType, referenceName) {
    const entry = this.getEntry(account, referenceType, referenceName);
    entry.credit += amount;
    await this.setAccountBalanceChange(account, 'credit', amount);
  }

  async setAccountBalanceChange(accountName, type, amount) {
    const debitAccounts = ['Asset', 'Expense'];
    const { rootType } = await frappe.getDoc('Account', accountName);
    if (debitAccounts.indexOf(rootType) === -1) {
      const change = type == 'credit' ? amount : -1 * amount;
      this.accountEntries.push({
        name: accountName,
        balanceChange: change
      });
    } else {
      const change = type == 'debit' ? amount : -1 * amount;
      this.accountEntries.push({
        name: accountName,
        balanceChange: change
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

    let data = await frappe.db.getAll({
      doctype: 'AccountingLedgerEntry',
      fields: ['name'],
      filters: {
        referenceName: this.reference.name,
        reverted: 0
      }
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
      entry.balanceChange = -1 * entry.balanceChange;
    }
    await this.insertEntries();
  }

  makeRoundOffEntry() {
    let { debit, credit } = this.getTotalDebitAndCredit();
    let precision = this.getPrecision();
    let difference = round(debit - credit, precision);
    let absoluteValue = Math.abs(difference);
    let allowance = 0.5;
    if (absoluteValue === 0) {
      return;
    }

    let roundOffAccount = this.getRoundOffAccount();
    if (absoluteValue <= allowance) {
      if (difference > 0) {
        this.credit(roundOffAccount, absoluteValue);
      } else {
        this.debit(roundOffAccount, absoluteValue);
      }
    }
  }

  validateEntries() {
    let { debit, credit } = this.getTotalDebitAndCredit();
    if (debit !== credit) {
      throw new Error(
        `Total Debit (${debit}) must be equal to Total Credit (${credit})`
      );
    }
  }

  getTotalDebitAndCredit() {
    let debit = 0;
    let credit = 0;

    for (let entry of this.entries) {
      debit += entry.debit;
      credit += entry.credit;
    }

    let precision = this.getPrecision();
    debit = round(debit, precision);
    credit = round(credit, precision);

    return { debit, credit };
  }

  async insertEntries() {
    for (let entry of this.entries) {
      let entryDoc = frappe.newDoc({
        doctype: 'AccountingLedgerEntry'
      });
      Object.assign(entryDoc, entry);
      await entryDoc.insert();
    }
    for (let entry of this.accountEntries) {
      let entryDoc = await frappe.getDoc('Account', entry.name);
      entryDoc.balance += entry.balanceChange;
      await entryDoc.update();
    }
  }

  getPrecision() {
    return frappe.SystemSettings.floatPrecision;
  }

  getRoundOffAccount() {
    return frappe.AccountingSettings.roundOffAccount;
  }
};
