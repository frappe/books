import { Fyo, t } from 'fyo';
import { NotFoundError, ValidationError } from 'fyo/utils/errors';
import { AccountingLedgerEntry } from 'models/baseModels/AccountingLedgerEntry/AccountingLedgerEntry';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { Transactional } from './Transactional';
import { TransactionType } from './types';

/**
 * # LedgerPosting
 *
 * Class that maintains a set of AccountingLedgerEntries pertaining to
 * a single Transactional doc, example a Payment entry.
 *
 * For each account touched in a transactional doc a separate ledger entry is
 * created.
 *
 * This is done using the `debit(...)` and `credit(...)` methods.
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

  constructor(refDoc: Transactional, fyo: Fyo) {
    this.fyo = fyo;
    this.refDoc = refDoc;
    this.entries = [];
    this.creditMap = {};
    this.debitMap = {};
    this.reverted = false;
  }

  async debit(account: string, amount: Money) {
    const ledgerEntry = this._getLedgerEntry(account, 'debit');
    await ledgerEntry.set('debit', ledgerEntry.debit!.add(amount));
  }

  async credit(account: string, amount: Money) {
    const ledgerEntry = this._getLedgerEntry(account, 'credit');
    await ledgerEntry.set('credit', ledgerEntry.credit!.add(amount));
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

  timezoneDateTimeAdjuster(setDate: string | Date) {
    const dateTimeValue = new Date(setDate);

    const dtFixedValue = dateTimeValue;
    const dtMinutes = dtFixedValue.getTimezoneOffset() % 60;
    const dtHours = (dtFixedValue.getTimezoneOffset() - dtMinutes) / 60;
    // Forcing the time to always be set to 00:00.000 for locale time
    dtFixedValue.setHours(0 - dtHours);
    dtFixedValue.setMinutes(0 - dtMinutes);
    dtFixedValue.setSeconds(0);
    dtFixedValue.setMilliseconds(0);

    return dtFixedValue;
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
      await this.credit(roundOffAccount, absoluteValue);
    } else {
      await this.debit(roundOffAccount, absoluteValue);
    }
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

    // end ugly timezone fix code

    const ledgerEntry = this.fyo.doc.getNewDoc(
      ModelNameEnum.AccountingLedgerEntry,
      {
        account: account,
        party: (this.refDoc.party as string) ?? '',
        date: this.timezoneDateTimeAdjuster(this.refDoc.date as string | Date),
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
  }

  async _syncLedgerEntries() {
    for (const entry of this.entries) {
      await entry.sync();
    }
  }

  async _syncReverse() {
    await this._syncReverseLedgerEntries();
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
