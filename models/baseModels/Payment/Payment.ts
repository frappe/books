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
  ValidationMap
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import {
  getDocStatus,
  getLedgerLinkAction,
  getStatusMap,
  statusColor
} from 'models/helpers';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { Transactional } from 'models/Transactional/Transactional';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { Invoice } from '../Invoice/Invoice';
import { Party } from '../Party/Party';
import { PaymentFor } from '../PaymentFor/PaymentFor';
import { PaymentMethod, PaymentType } from './types';

export class Payment extends Transactional {
  party?: string;
  amount?: Money;
  writeoff?: Money;
  paymentType?: PaymentType;

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
      this.amount = (this.amount as Money).add(
        paymentReference.amount as Money
      );
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

    this.validateAccounts();
    this.validateTotalReferenceAmount();
    this.validateWriteOffAccount();
    await this.validateReferences();
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

  validateWriteOffAccount() {
    if ((this.writeoff as Money).isZero()) {
      return;
    }

    if (!this.fyo.singles.AccountingSettings!.writeOffAccount) {
      throw new ValidationError(
        this.fyo.t`Write Off Account not set.
          Please set Write Off Account in General Settings`
      );
    }
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
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);

    const paymentAccount = this.paymentAccount as string;
    const account = this.account as string;
    const amount = this.amount as Money;

    await posting.debit(paymentAccount as string, amount);
    await posting.credit(account as string, amount);

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
    const forReferences = (this.for ?? []) as PaymentFor[];
    if (forReferences.length === 0) {
      return;
    }

    for (const row of forReferences) {
      this.validateReferenceType(row);
      await this.validateReferenceOutstanding(row);
    }
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

  async validateReferenceOutstanding(row: PaymentFor) {
    const referenceDoc = await this.fyo.doc.getDoc(
      row.referenceType as string,
      row.referenceName as string
    );

    const outstandingAmount = referenceDoc.outstandingAmount as Money;
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
    for (const row of (this.for ?? []) as PaymentFor[]) {
      const referenceDoc = await this.fyo.doc.getDoc(
        row.referenceType!,
        row.referenceName!
      );

      const previousOutstandingAmount = referenceDoc.outstandingAmount as Money;
      const outstandingAmount = previousOutstandingAmount.sub(this.amount!);
      await referenceDoc.setAndSync({ outstandingAmount });
    }
  }

  async afterCancel() {
    await super.afterCancel();
    this.revertOutstandingAmount();
  }

  async revertOutstandingAmount() {
    await this._revertReferenceOutstanding();
    await this.updatePartyOutstanding();
  }

  async _revertReferenceOutstanding() {
    for (const ref of (this.for ?? []) as PaymentFor[]) {
      const refDoc = await this.fyo.doc.getDoc(
        ref.referenceType!,
        ref.referenceName!
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
      this.party!
    )) as Party;
    await partyDoc.updateOutstandingAmount();
  }

  static defaults: DefaultMap = { date: () => new Date().toISOString() };

  formulas: FormulaMap = {
    account: {
      formula: async () => {
        if (this.paymentMethod === 'Cash' && this.paymentType === 'Pay') {
          return 'Cash';
        }
      },
      dependsOn: ['paymentMethod', 'paymentType'],
    },
    paymentAccount: {
      formula: async () => {
        if (this.paymentMethod === 'Cash' && this.paymentType === 'Receive') {
          return 'Cash';
        }
      },
      dependsOn: ['paymentMethod', 'paymentType'],
    },
    paymentType: {
      formula: async () => {
        if (!this.party) {
          return;
        }
        const partyDoc = await this.fyo.doc.getDoc(
          ModelNameEnum.Party,
          this.party
        );
        if (partyDoc.role === 'Supplier') {
          return 'Pay';
        } else if (partyDoc.role === 'Customer') {
          return 'Receive';
        }

        const outstanding = partyDoc.outstandingAmount as Money;
        if (outstanding?.isZero() ?? true) {
          return '';
        }

        if (outstanding?.isPositive()) {
          return 'Receive';
        }
        return 'Pay';
      },
    },
    amount: {
      formula: async () => this.getSum('for', 'amount', false),
      dependsOn: ['for'],
    },
    amountPaid: {
      formula: async () => this.amount!.sub(this.writeoff!),
      dependsOn: ['amount', 'writeoff', 'for'],
    },
  };

  validations: ValidationMap = {
    amount: async (value: DocValue) => {
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
  };

  static filters: FiltersMap = {
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

  static getListViewSettings(fyo: Fyo): ListViewSettings {
    return {
      columns: [
        'name',
        {
          label: t`Status`,
          fieldname: 'status',
          fieldtype: 'Select',
          size: 'small',
          render(doc) {
            const status = getDocStatus(doc);
            const color = statusColor[status] ?? 'gray';
            const label = getStatusMap()[status];

            return {
              template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
            };
          },
        },
        'party',
        'date',
        'amount',
      ],
    };
  }
}
