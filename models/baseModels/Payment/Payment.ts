import { LedgerPosting } from 'accounting/ledgerPosting';
import { Fyo } from 'fyo';
import { DocValue } from 'fyo/core/types';
import Doc from 'fyo/model/doc';
import {
  Action,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  HiddenMap,
  ListViewSettings,
  RequiredMap,
  ValidationMap,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { getLedgerLinkAction } from 'models/helpers';
import Money from 'pesa/dist/types/src/money';
import { getIsNullOrUndef } from 'utils';
import { Party } from '../Party/Party';
import { PaymentMethod, PaymentType } from './types';

export class Payment extends Doc {
  party?: string;
  amount?: Money;
  writeoff?: Money;

  async change({ changed }: { changed: string }) {
    switch (changed) {
      case 'for': {
        this.updateAmountOnReferenceUpdate();
        await this.updateDetailsOnReferenceUpdate();
      }
      case 'amount': {
        this.updateReferenceOnAmountUpdate();
      }
    }
  }

  async updateDetailsOnReferenceUpdate() {
    const forReferences = (this.for ?? []) as Doc[];
    const { referenceType, referenceName } = forReferences[0];
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
    const doc = await this.fyo.doc.getDoc(schemaName, referenceName as string);

    let party;
    let paymentType: PaymentType;

    if (schemaName === 'SalesInvoice') {
      party = doc.customer;
      paymentType = 'Receive';
    } else {
      party = doc.supplier;
      paymentType = 'Pay';
    }

    this.party = party as string;
    this.paymentType = paymentType;
  }

  updateAmountOnReferenceUpdate() {
    this.amount = this.fyo.pesa(0);
    for (const paymentReference of this.for as Doc[]) {
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
    this.validateAccounts();
    this.validateReferenceAmount();
    this.validateWriteOff();
  }

  validateAccounts() {
    if (this.paymentAccount !== this.account || !this.account) {
      return;
    }
    throw new this.fyo.errors.ValidationError(
      `To Account and From Account can't be the same: ${this.account}`
    );
  }

  validateReferenceAmount() {
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

  validateWriteOff() {
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
    const account = this.account as string;
    const paymentAccount = this.paymentAccount as string;
    const amount = this.amount as Money;
    const writeoff = this.writeoff as Money;
    const entries = new LedgerPosting(
      {
        reference: this,
        party: this.party!,
      },
      this.fyo
    );

    await entries.debit(paymentAccount as string, amount.sub(writeoff));
    await entries.credit(account as string, amount.sub(writeoff));

    if (writeoff.isZero()) {
      return [entries];
    }

    const writeoffEntry = new LedgerPosting(
      {
        reference: this,
        party: this.party!,
      },
      this.fyo
    );
    const writeOffAccount = this.fyo.singles.AccountingSettings!
      .writeOffAccount as string;

    if (this.paymentType === 'Pay') {
      await writeoffEntry.debit(account, writeoff);
      await writeoffEntry.credit(writeOffAccount, writeoff);
    } else {
      await writeoffEntry.debit(writeOffAccount, writeoff);
      await writeoffEntry.credit(account, writeoff);
    }

    return [entries, writeoffEntry];
  }

  async beforeSubmit() {
    const forReferences = (this.for ?? []) as Doc[];
    if (forReferences.length === 0) {
      return;
    }

    for (const row of forReferences) {
      if (
        !['SalesInvoice', 'PurchaseInvoice'].includes(
          row.referenceType as string
        )
      ) {
        continue;
      }
      const referenceDoc = await this.fyo.doc.getDoc(
        row.referenceType as string,
        row.referenceName as string
      );

      let outstandingAmount = referenceDoc.outstandingAmount as Money;
      const baseGrandTotal = referenceDoc.baseGrandTotal as Money;
      const amount = this.amount as Money;

      if (getIsNullOrUndef(outstandingAmount)) {
        outstandingAmount = baseGrandTotal;
      }

      if (amount.lte(0) || amount.gt(outstandingAmount)) {
        let message = this.fyo.t`Payment amount: ${this.fyo.format(
          this.amount!,
          'Currency'
        )} should be less than Outstanding amount: ${this.fyo.format(
          outstandingAmount,
          'Currency'
        )}.`;

        if (amount.lte(0)) {
          const amt = this.fyo.format(this.amount!, 'Currency');
          message = this.fyo
            .t`Payment amount: ${amt} should be greater than 0.`;
        }

        throw new ValidationError(message);
      } else {
        // update outstanding amounts in invoice and party
        const newOutstanding = outstandingAmount.sub(amount);
        await referenceDoc.set('outstandingAmount', newOutstanding);
        await referenceDoc.update();
        const party = (await this.fyo.doc.getDoc(
          'Party',
          this.party!
        )) as Party;

        await party.updateOutstandingAmount();
      }
    }
  }

  async afterSubmit() {
    const entryList = await this.getPosting();
    for (const entry of entryList) {
      await entry.post();
    }
  }

  async afterRevert() {
    this.updateReferenceOutstandingAmount();
    const entryList = await this.getPosting();
    for (const entry of entryList) {
      await entry.postReverse();
    }
  }

  async updateReferenceOutstandingAmount() {
    await (this.for as Doc[]).forEach(
      async ({ amount, referenceType, referenceName }) => {
        const refDoc = await this.fyo.doc.getDoc(
          referenceType as string,
          referenceName as string
        );

        refDoc.setMultiple({
          outstandingAmount: (refDoc.outstandingAmount as Money).add(
            amount as Money
          ),
        });
        refDoc.update();
      }
    );
  }

  defaults: DefaultMap = { date: () => new Date().toISOString() };

  formulas: FormulaMap = {
    account: async () => {
      if (this.paymentMethod === 'Cash' && this.paymentType === 'Pay') {
        return 'Cash';
      }
    },
    paymentAccount: async () => {
      if (this.paymentMethod === 'Cash' && this.paymentType === 'Receive') {
        return 'Cash';
      }
    },
    amount: async () => this.getSum('for', 'amount', false),
  };

  validations: ValidationMap = {
    amount: async (value: DocValue) => {
      if ((value as Money).isNegative()) {
        throw new ValidationError(
          this.fyo.t`Payment amount cannot be less than zero.`
        );
      }

      if ((this.for as Doc[]).length === 0) return;
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
    clearanceDate: () => this.paymentMethod === 'Cash',
  };

  hidden: HiddenMap = {
    referenceId: () => this.paymentMethod !== 'Cash',
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
        'party',
        {
          label: fyo.t`Status`,
          fieldname: 'status',
          fieldtype: 'Select',
          size: 'small',
          render(doc) {
            let status = 'Draft';
            let color = 'gray';
            if (doc.submitted === 1) {
              color = 'green';
              status = 'Submitted';
            }
            if (doc.cancelled === 1) {
              color = 'red';
              status = 'Cancelled';
            }

            return {
              template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
            };
          },
        },
        'paymentType',
        'date',
        'amount',
      ],
    };
  }
}
