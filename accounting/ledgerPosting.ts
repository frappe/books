import frappe from 'frappe';
import Doc from 'frappe/model/doc';
import Money from 'pesa/dist/types/src/money';
import {
  AccountEntry,
  LedgerEntry,
  LedgerPostingOptions,
  TransactionType,
} from './types';

export class LedgerPosting {
  reference: Doc;
  party?: string;
  date?: string;
  description?: string;
  entries: LedgerEntry[];
  entryMap: Record<string, LedgerEntry>;
  reverted: boolean;
  accountEntries: AccountEntry[];

  constructor({ reference, party, date, description }: LedgerPostingOptions) {
    this.reference = reference;
    this.party = party;
    this.date = date;
    this.description = description ?? '';
    this.entries = [];
    this.entryMap = {};
    this.reverted = false;
    // To change balance while entering ledger entries
    this.accountEntries = [];
  }

  async debit(
    account: string,
    amount: Money,
    referenceType?: string,
    referenceName?: string
  ) {
    const entry = this.getEntry(account, referenceType, referenceName);
    entry.debit = entry.debit.add(amount);
    await this.setAccountBalanceChange(account, 'debit', amount);
  }

  async credit(
    account: string,
    amount: Money,
    referenceType?: string,
    referenceName?: string
  ) {
    const entry = this.getEntry(account, referenceType, referenceName);
    entry.credit = entry.credit.add(amount);
    await this.setAccountBalanceChange(account, 'credit', amount);
  }

  async setAccountBalanceChange(
    accountName: string,
    type: TransactionType,
    amount: Money
  ) {
    const debitAccounts = ['Asset', 'Expense'];
    const accountDoc = await frappe.doc.getDoc('Account', accountName);
    const rootType = accountDoc.rootType as string;

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

  getEntry(account: string, referenceType?: string, referenceName?: string) {
    if (!this.entryMap[account]) {
      const entry: LedgerEntry = {
        account: account,
        party: this.party ?? '',
        date: this.date ?? (this.reference.date as string),
        referenceType: referenceType ?? this.reference.schemaName,
        referenceName: referenceName ?? this.reference.name!,
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

    const data = await frappe.db.getAll('AccountingLedgerEntry', {
      fields: ['name'],
      filters: {
        referenceName: this.reference.name!,
        reverted: false,
      },
    });

    for (const entry of data) {
      const entryDoc = await frappe.doc.getDoc(
        'AccountingLedgerEntry',
        entry.name as string
      );
      entryDoc.reverted = true;
      await entryDoc.update();
    }

    let temp;
    for (const entry of this.entries) {
      temp = entry.debit;
      entry.debit = entry.credit;
      entry.credit = temp;
      entry.reverted = true;
    }
    for (const entry of this.accountEntries) {
      entry.balanceChange = (entry.balanceChange as Money).neg();
    }
    await this.insertEntries();
  }

  makeRoundOffEntry() {
    const { debit, credit } = this.getTotalDebitAndCredit();
    const difference = debit.sub(credit);
    const absoluteValue = difference.abs();
    const allowance = 0.5;
    if (absoluteValue.eq(0)) {
      return;
    }

    const roundOffAccount = this.getRoundOffAccount();
    if (absoluteValue.lte(allowance)) {
      if (difference.gt(0)) {
        this.credit(roundOffAccount, absoluteValue);
      } else {
        this.debit(roundOffAccount, absoluteValue);
      }
    }
  }

  validateEntries() {
    const { debit, credit } = this.getTotalDebitAndCredit();
    if (debit.neq(credit)) {
      throw new frappe.errors.ValidationError(
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

    for (const entry of this.entries) {
      debit = debit.add(entry.debit);
      credit = credit.add(entry.credit);
    }

    return { debit, credit };
  }

  async insertEntries() {
    for (const entry of this.entries) {
      const entryDoc = frappe.doc.getNewDoc('AccountingLedgerEntry');
      Object.assign(entryDoc, entry);
      await entryDoc.insert();
    }
    for (const entry of this.accountEntries) {
      const entryDoc = await frappe.doc.getDoc('Account', entry.name);
      const balance = entryDoc.get('balance') as Money;
      entryDoc.balance = balance.add(entry.balanceChange);
      await entryDoc.update();
    }
  }

  getRoundOffAccount() {
    return frappe.singles.AccountingSettings!.roundOffAccount as string;
  }
}
