import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ValidationError } from 'fyo/utils/errors';
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

  fyo: Fyo;

  constructor(
    { reference, party, date, description }: LedgerPostingOptions,
    fyo: Fyo
  ) {
    this.reference = reference;
    this.party = party;
    this.date = date;
    this.description = description ?? '';
    this.entries = [];
    this.entryMap = {};
    this.reverted = false;
    // To change balance while entering ledger entries
    this.accountEntries = [];

    this.fyo = fyo;
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
    const accountDoc = await this.fyo.doc.getDoc('Account', accountName);
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
        debit: this.fyo.pesa(0),
        credit: this.fyo.pesa(0),
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

    const data = await this.fyo.db.getAll('AccountingLedgerEntry', {
      fields: ['name'],
      filters: {
        referenceName: this.reference.name!,
        reverted: false,
      },
    });

    for (const entry of data) {
      const entryDoc = await this.fyo.doc.getDoc(
        'AccountingLedgerEntry',
        entry.name as string
      );
      entryDoc.reverted = true;
      await entryDoc.sync();
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
      throw new ValidationError(
        `Total Debit: ${this.fyo.format(
          debit,
          'Currency'
        )} must be equal to Total Credit: ${this.fyo.format(
          credit,
          'Currency'
        )}`
      );
    }
  }

  getTotalDebitAndCredit() {
    let debit = this.fyo.pesa(0);
    let credit = this.fyo.pesa(0);

    for (const entry of this.entries) {
      debit = debit.add(entry.debit);
      credit = credit.add(entry.credit);
    }

    return { debit, credit };
  }

  async insertEntries() {
    for (const entry of this.entries) {
      const entryDoc = this.fyo.doc.getNewDoc('AccountingLedgerEntry');
      Object.assign(entryDoc, entry);
      await entryDoc.sync();
    }
    for (const entry of this.accountEntries) {
      const entryDoc = await this.fyo.doc.getDoc('Account', entry.name);
      const balance = entryDoc.get('balance') as Money;
      entryDoc.balance = balance.add(entry.balanceChange);
      await entryDoc.sync();
    }
  }

  getRoundOffAccount() {
    return this.fyo.singles.AccountingSettings!.roundOffAccount as string;
  }
}
