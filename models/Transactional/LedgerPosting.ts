import { Fyo, t } from 'fyo';
import { NotFoundError, ValidationError } from 'fyo/utils/errors';
import { Account } from 'models/baseModels/Account/Account';
import { AccountingLedgerEntry } from 'models/baseModels/AccountingLedgerEntry/AccountingLedgerEntry';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { Transactional } from './Transactional';
import { AccountBalanceChange, TransactionType } from './types';

/**
 * # LedgerPosting
 *
 * Class that maintains a set of AccountingLedgerEntries pertaining to
 * a single Transactional doc, example a Payment entry.
 *
 * For each account touched in a transactional doc a separate ledger entry is
 * created.
 *
 * This is done using the `debit(...)` and `credit(...)` methods which also
 * keep track of the change in balance to an account.
 *
 * Unless `post()` or `postReverese()` is called the entries aren't made.
 */

export class LedgerPosting {
  fyo: Fyo;
  refDoc: Transactional;
  entries: AccountingLedgerEntry[];
  creditMap: Record<string, AccountingLedgerEntry>;
  debitMap: Record<string, AccountingLedgerEntry>;
  reverted: boolean;
  accountBalanceChanges: AccountBalanceChange[];

  constructor(refDoc: Transactional, fyo: Fyo) {
    this.fyo = fyo;
    this.refDoc = refDoc;
    this.entries = [];
    this.creditMap = {};
    this.debitMap = {};
    this.reverted = false;
    this.accountBalanceChanges = [];
  }

  async debit(account: string, amount: Money) {
    const ledgerEntry = this._getLedgerEntry(account, 'debit');
    await ledgerEntry.set('debit', ledgerEntry.debit!.add(amount));
    await this._updateAccountBalanceChange(account, 'debit', amount);
  }

  async credit(account: string, amount: Money) {
    const ledgerEntry = this._getLedgerEntry(account, 'credit');
    await ledgerEntry.set('credit', ledgerEntry.credit!.add(amount));
    await this._updateAccountBalanceChange(account, 'credit', amount);
  }

  async post() {
    this._validateIsEqual();
    await this._sync();
  }

  async postReverse() {
    this._validateIsEqual();
    await this._syncReverse();
  }

  validate() {
    this._validateIsEqual();
  }

  async makeRoundOffEntry() {
    const { debit, credit } = this._getTotalDebitAndCredit();
    const difference = debit.sub(credit);
    const absoluteValue = difference.abs();
    if (absoluteValue.eq(0)) {
      return;
    }

    const roundOffAccount = await this._getRoundOffAccount();
    if (difference.gt(0)) {
      this.credit(roundOffAccount, absoluteValue);
    } else {
      this.debit(roundOffAccount, absoluteValue);
    }
  }

  async _updateAccountBalanceChange(
    name: string,
    type: TransactionType,
    amount: Money
  ) {
    const accountDoc = (await this.fyo.doc.getDoc('Account', name)) as Account;

    let change: Money;
    if (accountDoc.isDebit) {
      change = type === 'debit' ? amount : amount.neg();
    } else {
      change = type === 'credit' ? amount : amount.neg();
    }

    this.accountBalanceChanges.push({
      name,
      change,
    });
  }

  _getLedgerEntry(
    account: string,
    type: TransactionType
  ): AccountingLedgerEntry {
    let map = this.creditMap;
    if (type === 'debit') {
      map = this.debitMap;
    }

    if (map[account]) {
      return map[account];
    }

    const ledgerEntry = this.fyo.doc.getNewDoc(
      ModelNameEnum.AccountingLedgerEntry,
      {
        account: account,
        party: (this.refDoc.party as string) ?? '',
        date: this.refDoc.date as string | Date,
        referenceType: this.refDoc.schemaName,
        referenceName: this.refDoc.name!,
        reverted: this.reverted,
        debit: this.fyo.pesa(0),
        credit: this.fyo.pesa(0),
      },
      false
    ) as AccountingLedgerEntry;

    this.entries.push(ledgerEntry);
    map[account] = ledgerEntry;

    return map[account];
  }

  _validateIsEqual() {
    const { debit, credit } = this._getTotalDebitAndCredit();
    if (debit.eq(credit)) {
      return;
    }

    throw new ValidationError(
      t`Total Debit: ${this.fyo.format(
        debit,
        'Currency'
      )} must be equal to Total Credit: ${this.fyo.format(credit, 'Currency')}`
    );
  }

  _getTotalDebitAndCredit() {
    let debit = this.fyo.pesa(0);
    let credit = this.fyo.pesa(0);

    for (const entry of this.entries) {
      debit = debit.add(entry.debit!);
      credit = credit.add(entry.credit!);
    }

    return { debit, credit };
  }

  async _sync() {
    await this._syncLedgerEntries();
    await this._syncBalanceChanges();
  }

  async _syncLedgerEntries() {
    for (const entry of this.entries) {
      await entry.sync();
    }
  }

  async _syncReverse() {
    await this._syncReverseLedgerEntries();
    for (const entry of this.accountBalanceChanges) {
      entry.change = (entry.change as Money).neg();
    }
    await this._syncBalanceChanges();
  }

  async _syncBalanceChanges() {
    for (const { name, change } of this.accountBalanceChanges) {
      const accountDoc = await this.fyo.doc.getDoc(ModelNameEnum.Account, name);
      const balance = accountDoc.get('balance') as Money;
      await accountDoc.setAndSync('balance', balance.add(change));
    }
  }

  async _syncReverseLedgerEntries() {
    const data = (await this.fyo.db.getAll('AccountingLedgerEntry', {
      fields: ['name'],
      filters: {
        referenceType: this.refDoc.schemaName,
        referenceName: this.refDoc.name!,
        reverted: false,
      },
    })) as { name: string }[];

    for (const { name } of data) {
      const doc = (await this.fyo.doc.getDoc(
        'AccountingLedgerEntry',
        name
      )) as AccountingLedgerEntry;
      await doc.revert();
    }
  }

  async _getRoundOffAccount() {
    const roundOffAccount = (await this.fyo.getValue(
      ModelNameEnum.AccountingSettings,
      'roundOffAccount'
    )) as string;

    if (!roundOffAccount) {
      const notFoundError = new NotFoundError(
        t`Please set Round Off Account in the Settings.`,
        false
      );
      notFoundError.name = t`Round Off Account Not Found`;
      throw notFoundError;
    }

    return roundOffAccount;
  }
}
