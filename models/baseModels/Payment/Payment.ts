import { Fyo, t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  ChangeArg,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  HiddenMap,
  ListViewSettings,
  RequiredMap,
  ValidationMap,
} from 'fyo/model/types';
import { NotFoundError, ValidationError } from 'fyo/utils/errors';
import {
  getDocStatusListColumn,
  getLedgerLinkAction,
  getNumberSeries,
} from 'models/helpers';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { Transactional } from 'models/Transactional/Transactional';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { QueryFilter } from 'utils/db/types';
import { AccountTypeEnum } from '../Account/types';
import { Invoice } from '../Invoice/Invoice';
import { Party } from '../Party/Party';
import { PaymentFor } from '../PaymentFor/PaymentFor';
import { PaymentMethod, PaymentType } from './types';

type AccountTypeMap = Record<AccountTypeEnum, string[] | undefined>;

export class Payment extends Transactional {
  party?: string;
  amount?: Money;
  writeoff?: Money;
  paymentType?: PaymentType;
  for?: PaymentFor[];
  _accountsMap?: AccountTypeMap;

  async change({ changed }: ChangeArg) {
    if (changed === 'for') {
      this.updateAmountOnReferenceUpdate();
      await this.updateDetailsOnReferenceUpdate();
    }

    if (changed === 'amount') {
      this.updateReferenceOnAmountUpdate();
    }
  }

  async updateDetailsOnReferenceUpdate() {
    const forReferences = (this.for ?? []) as Doc[];

    const { referenceType, referenceName } = forReferences[0] ?? {};
    if (
      forReferences.length !== 1 ||
      this.party ||
      this.paymentType ||
      !referenceName ||
      !referenceType
    ) {
      return;
    }

    const schemaName = referenceType as string;
    const doc = (await this.fyo.doc.getDoc(
      schemaName,
      referenceName as string
    )) as Invoice;

    let paymentType: PaymentType;
    if (doc.isSales) {
      paymentType = 'Receive';
    } else {
      paymentType = 'Pay';
    }

    this.party = doc.party as string;
    this.paymentType = paymentType;
  }

  updateAmountOnReferenceUpdate() {
    this.amount = this.fyo.pesa(0);
    for (const paymentReference of (this.for ?? []) as Doc[]) {
      this.amount = this.amount.add(paymentReference.amount as Money);
    }
  }

  updateReferenceOnAmountUpdate() {
    const forReferences = (this.for ?? []) as Doc[];
    if (forReferences.length !== 1) {
      return;
    }

    forReferences[0].amount = this.amount;
  }

  async validate() {
    await super.validate();
    if (this.submitted) {
      return;
    }

    await this.validateFor();
    this.validateAccounts();
    this.validateTotalReferenceAmount();
    await this.validateReferences();
  }

  async validateFor() {
    for (const childDoc of this.for ?? []) {
      const referenceName = childDoc.referenceName;
      const referenceType = childDoc.referenceType;

      const refDoc = (await this.fyo.doc.getDoc(
        childDoc.referenceType!,
        childDoc.referenceName
      )) as Invoice;

      if (referenceName && referenceType && !refDoc) {
        throw new ValidationError(
          t`${referenceType} of type ${
            this.fyo.schemaMap?.[referenceType]?.label ?? referenceType
          } does not exist`
        );
      }

      if (!refDoc) {
        continue;
      }

      if (refDoc?.party !== this.party) {
        throw new ValidationError(
          t`${refDoc.name!} party ${refDoc.party!} is different from ${this
            .party!}`
        );
      }
    }
  }

  validateAccounts() {
    if (this.paymentAccount !== this.account || !this.account) {
      return;
    }

    throw new this.fyo.errors.ValidationError(
      t`To Account and From Account can't be the same: ${
        this.account as string
      }`
    );
  }

  validateTotalReferenceAmount() {
    const forReferences = (this.for ?? []) as Doc[];
    if (forReferences.length === 0) {
      return;
    }

    const referenceAmountTotal = forReferences
      .map(({ amount }) => amount as Money)
      .reduce((a, b) => a.add(b), this.fyo.pesa(0));

    if (
      (this.amount as Money)
        .add((this.writeoff as Money) ?? 0)
        .gte(referenceAmountTotal)
    ) {
      return;
    }

    const writeoff = this.fyo.format(this.writeoff!, 'Currency');
    const payment = this.fyo.format(this.amount!, 'Currency');
    const refAmount = this.fyo.format(referenceAmountTotal, 'Currency');

    if ((this.writeoff as Money).gt(0)) {
      throw new ValidationError(
        this.fyo.t`Amount: ${payment} and writeoff: ${writeoff} 
          is less than the total amount allocated to 
          references: ${refAmount}.`
      );
    }

    throw new ValidationError(
      this.fyo.t`Amount: ${payment} is less than the total
        amount allocated to references: ${refAmount}.`
    );
  }

  async validateWriteOffAccount() {
    if ((this.writeoff as Money).isZero()) {
      return;
    }

    const writeOffAccount = this.fyo.singles.AccountingSettings!
      .writeOffAccount as string | null | undefined;

    if (!writeOffAccount) {
      throw new NotFoundError(
        t`Write Off Account not set.
          Please set Write Off Account in General Settings`,
        false
      );
    }

    const exists = await this.fyo.db.exists(
      ModelNameEnum.Account,
      writeOffAccount
    );

    if (exists) {
      return;
    }

    throw new NotFoundError(
      t`Write Off Account ${writeOffAccount} does not exist.
          Please set Write Off Account in General Settings`,
      false
    );
  }

  async getPosting() {
    /**
     * account        : From Account
     * paymentAccount : To Account
     *
     * if Receive
     * -        account : Debtors, etc
     * - paymentAccount : Cash, Bank, etc
     *
     * if Pay
     * -        account : Cash, Bank, etc
     * - paymentAccount : Creditors, etc
     */
    await this.validateWriteOffAccount();
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);

    const paymentAccount = this.paymentAccount as string;
    const account = this.account as string;
    const amount = this.amount as Money;

    await posting.debit(paymentAccount, amount);
    await posting.credit(account, amount);

    await this.applyWriteOffPosting(posting);
    return posting;
  }

  async applyWriteOffPosting(posting: LedgerPosting) {
    const writeoff = this.writeoff as Money;
    if (writeoff.isZero()) {
      return posting;
    }

    const account = this.account as string;
    const paymentAccount = this.paymentAccount as string;
    const writeOffAccount = this.fyo.singles.AccountingSettings!
      .writeOffAccount as string;

    if (this.paymentType === 'Pay') {
      await posting.credit(paymentAccount, writeoff);
      await posting.debit(writeOffAccount, writeoff);
    } else {
      await posting.debit(account, writeoff);
      await posting.credit(writeOffAccount, writeoff);
    }
  }

  async validateReferences() {
    const forReferences = this.for ?? [];
    if (forReferences.length === 0) {
      return;
    }

    for (const row of forReferences) {
      this.validateReferenceType(row);
    }

    await this.validateReferenceOutstanding();
  }

  validateReferenceType(row: PaymentFor) {
    const referenceType = row.referenceType;
    if (
      ![ModelNameEnum.SalesInvoice, ModelNameEnum.PurchaseInvoice].includes(
        referenceType!
      )
    ) {
      throw new ValidationError(t`Please select a valid reference type.`);
    }
  }

  async validateReferenceOutstanding() {
    let outstandingAmount = this.fyo.pesa(0);
    for (const row of this.for ?? []) {
      const referenceDoc = (await this.fyo.doc.getDoc(
        row.referenceType as string,
        row.referenceName as string
      )) as Invoice;

      outstandingAmount = outstandingAmount.add(
        referenceDoc.outstandingAmount ?? 0
      );
    }

    const amount = this.amount as Money;

    if (amount.gt(0) && amount.lte(outstandingAmount)) {
      return;
    }

    let message = this.fyo.t`Payment amount: ${this.fyo.format(
      this.amount!,
      'Currency'
    )} should be less than Outstanding amount: ${this.fyo.format(
      outstandingAmount,
      'Currency'
    )}.`;

    if (amount.lte(0)) {
      const amt = this.fyo.format(this.amount!, 'Currency');
      message = this.fyo.t`Payment amount: ${amt} should be greater than 0.`;
    }

    throw new ValidationError(message);
  }

  async afterSubmit() {
    await super.afterSubmit();
    await this.updateReferenceDocOutstanding();
    await this.updatePartyOutstanding();
  }

  async updateReferenceDocOutstanding() {
    for (const row of this.for ?? []) {
      const referenceDoc = await this.fyo.doc.getDoc(
        row.referenceType!,
        row.referenceName
      );

      const previousOutstandingAmount = referenceDoc.outstandingAmount as Money;
      const outstandingAmount = previousOutstandingAmount.sub(row.amount!);
      await referenceDoc.setAndSync({ outstandingAmount });
    }
  }

  async afterCancel() {
    await super.afterCancel();
    await this.revertOutstandingAmount();
  }

  async revertOutstandingAmount() {
    await this._revertReferenceOutstanding();
    await this.updatePartyOutstanding();
  }

  async _revertReferenceOutstanding() {
    for (const ref of this.for ?? []) {
      const refDoc = await this.fyo.doc.getDoc(
        ref.referenceType!,
        ref.referenceName
      );

      const outstandingAmount = (refDoc.outstandingAmount as Money).add(
        ref.amount!
      );

      await refDoc.setAndSync({ outstandingAmount });
    }
  }

  async updatePartyOutstanding() {
    const partyDoc = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      this.party
    )) as Party;
    await partyDoc.updateOutstandingAmount();
  }

  static defaults: DefaultMap = {
    numberSeries: (doc) => getNumberSeries(doc.schemaName, doc.fyo),
    date: () => new Date(),
  };

  async _getAccountsMap(): Promise<AccountTypeMap> {
    if (this._accountsMap) {
      return this._accountsMap;
    }

    const accounts = (await this.fyo.db.getAll(ModelNameEnum.Account, {
      fields: ['name', 'accountType'],
      filters: {
        accountType: [
          'in',
          [
            AccountTypeEnum.Bank,
            AccountTypeEnum.Cash,
            AccountTypeEnum.Payable,
            AccountTypeEnum.Receivable,
          ],
        ],
      },
    })) as { name: string; accountType: AccountTypeEnum }[];

    return (this._accountsMap = accounts.reduce((acc, ac) => {
      acc[ac.accountType] ??= [];
      acc[ac.accountType]!.push(ac.name);
      return acc;
    }, {} as AccountTypeMap));
  }

  async _getReferenceAccount() {
    const account = await this._getAccountFromParty();
    if (!account) {
      return await this._getAccountFromFor();
    }

    return account;
  }

  async _getAccountFromParty() {
    const party = (await this.loadAndGetLink('party')) as Party | null;
    if (!party || party.role === 'Both') {
      return null;
    }

    return party.defaultAccount ?? null;
  }

  async _getAccountFromFor() {
    const reference = this?.for?.[0];
    if (!reference) {
      return null;
    }

    const refDoc = (await reference.loadAndGetLink(
      'referenceName'
    )) as Invoice | null;

    return refDoc?.account ?? null;
  }

  formulas: FormulaMap = {
    account: {
      formula: async () => {
        const accountsMap = await this._getAccountsMap();
        if (this.paymentType === 'Receive') {
          return (
            (await this._getReferenceAccount()) ??
            accountsMap[AccountTypeEnum.Receivable]?.[0] ??
            null
          );
        }

        if (this.paymentMethod === 'Cash') {
          return accountsMap[AccountTypeEnum.Cash]?.[0] ?? null;
        }

        if (this.paymentMethod !== 'Cash') {
          return accountsMap[AccountTypeEnum.Bank]?.[0] ?? null;
        }

        return null;
      },
      dependsOn: ['paymentMethod', 'paymentType', 'party'],
    },
    paymentAccount: {
      formula: async () => {
        const accountsMap = await this._getAccountsMap();
        if (this.paymentType === 'Pay') {
          return (
            (await this._getReferenceAccount()) ??
            accountsMap[AccountTypeEnum.Payable]?.[0] ??
            null
          );
        }

        if (this.paymentMethod === 'Cash') {
          return accountsMap[AccountTypeEnum.Cash]?.[0] ?? null;
        }

        if (this.paymentMethod !== 'Cash') {
          return accountsMap[AccountTypeEnum.Bank]?.[0] ?? null;
        }

        return null;
      },
      dependsOn: ['paymentMethod', 'paymentType', 'party'],
    },
    paymentType: {
      formula: async () => {
        if (!this.party) {
          return;
        }

        const partyDoc = (await this.loadAndGetLink('party')) as Party;
        if (partyDoc.role === 'Supplier') {
          return 'Pay';
        } else if (partyDoc.role === 'Customer') {
          return 'Receive';
        }

        const outstanding = partyDoc.outstandingAmount as Money;
        if (outstanding?.isZero() ?? true) {
          return this.paymentType;
        }

        if (outstanding?.isPositive()) {
          return 'Receive';
        }
        return 'Pay';
      },
    },
    amount: {
      formula: () => this.getSum('for', 'amount', false),
      dependsOn: ['for'],
    },
    amountPaid: {
      formula: () => this.amount!.sub(this.writeoff!),
      dependsOn: ['amount', 'writeoff', 'for'],
    },
  };

  validations: ValidationMap = {
    amount: (value: DocValue) => {
      if ((value as Money).isNegative()) {
        throw new ValidationError(
          this.fyo.t`Payment amount cannot be less than zero.`
        );
      }

      if (((this.for ?? []) as Doc[]).length === 0) {
        return;
      }

      const amount = this.getSum('for', 'amount', false);

      if ((value as Money).gt(amount)) {
        throw new ValidationError(
          this.fyo.t`Payment amount cannot 
              exceed ${this.fyo.format(amount, 'Currency')}.`
        );
      } else if ((value as Money).isZero()) {
        throw new ValidationError(
          this.fyo.t`Payment amount cannot
              be ${this.fyo.format(value, 'Currency')}.`
        );
      }
    },
  };

  required: RequiredMap = {
    referenceId: () => this.paymentMethod !== 'Cash',
    clearanceDate: () => this.paymentMethod !== 'Cash',
  };

  hidden: HiddenMap = {
    referenceId: () => this.paymentMethod === 'Cash',
    clearanceDate: () => this.paymentMethod === 'Cash',
    amountPaid: () => this.writeoff?.isZero() ?? true,
    attachment: () =>
      !(this.attachment || !(this.isSubmitted || this.isCancelled)),
    for: () => !!((this.isSubmitted || this.isCancelled) && !this.for?.length),
  };

  static filters: FiltersMap = {
    party: (doc: Doc) => {
      const paymentType = (doc as Payment).paymentType;
      if (paymentType === 'Pay') {
        return { role: ['in', ['Supplier', 'Both']] } as QueryFilter;
      }

      if (paymentType === 'Receive') {
        return { role: ['in', ['Customer', 'Both']] } as QueryFilter;
      }

      return {};
    },
    numberSeries: () => {
      return { referenceType: 'Payment' };
    },
    account: (doc: Doc) => {
      const paymentType = doc.paymentType as PaymentType;
      const paymentMethod = doc.paymentMethod as PaymentMethod;

      if (paymentType === 'Receive') {
        return { accountType: 'Receivable', isGroup: false };
      }

      if (paymentMethod === 'Cash') {
        return { accountType: 'Cash', isGroup: false };
      } else {
        return { accountType: ['in', ['Bank', 'Cash']], isGroup: false };
      }
    },
    paymentAccount: (doc: Doc) => {
      const paymentType = doc.paymentType as PaymentType;
      const paymentMethod = doc.paymentMethod as PaymentMethod;

      if (paymentType === 'Pay') {
        return { accountType: 'Payable', isGroup: false };
      }

      if (paymentMethod === 'Cash') {
        return { accountType: 'Cash', isGroup: false };
      } else {
        return { accountType: ['in', ['Bank', 'Cash']], isGroup: false };
      }
    },
  };

  static getActions(fyo: Fyo): Action[] {
    return [getLedgerLinkAction(fyo)];
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getDocStatusListColumn(), 'party', 'date', 'amount'],
    };
  }
}
