<template>
  <p class="pill font-medium" :class="styleClass">{{ text }}</p>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { Party } from 'models/baseModels/Party/Party';
import { Money } from 'pesa';
import { getBgTextColorClass } from 'src/utils/colors';
import { defineComponent } from 'vue';

type Status = ReturnType<typeof getStatus>;
type UIColors = 'gray' | 'orange' | 'red' | 'green' | 'blue' | 'yellow';

export default defineComponent({
  props: { doc: { type: Doc, required: true } },
  computed: {
    styleClass(): string {
      return getBgTextColorClass(this.color);
    },
    status(): Status {
      return getStatus(this.doc);
    },
    text() {
      const hasOutstanding = isPesa(this.doc.outstandingAmount);

      if (hasOutstanding && this.status === 'Unpaid') {
        const amt = this.fyo.format(this.doc.outstandingAmount, 'Currency');
        return this.t`Unpaid ${amt}`;
      }

      if (hasOutstanding && this.status === 'PartlyPaid') {
        const outstandingPayment = this.fyo.format(
          (this.doc.grandTotal as Money).sub(
            this.doc.outstandingAmount as Money
          ),
          'Currency'
        );
        return this.t`Partly Paid ${outstandingPayment}`;
      }

      if (this.status === 'Outstanding') {
        const outstandingPayment = this.fyo.format(
          this.doc.outstandingAmount as Money,
          'Currency'
        );
        return this.t`Unpaid ${outstandingPayment}`;
      }

      return {
        Draft: this.t`Draft`,
        Cancelled: this.t`Cancelled`,
        Outstanding: this.t`Outstanding`,
        NotTransferred: this.t`Not Transferred`,
        NotSaved: this.t`Not Saved`,
        NotSubmitted: this.t`Not Submitted`,
        Paid: this.t`Paid`,
        Saved: this.t`Saved`,
        Submitted: this.t`Submitted`,
        Return: this.t`Return`,
        ReturnIssued: this.t`Return Issued`,
        Unpaid: this.t`Unpaid`,
        PartlyPaid: this.t`Partly Paid`,
      }[this.status];
    },
    color(): UIColors {
      return statusColorMap[this.status];
    },
  },
});

const statusColorMap: Record<Status, UIColors> = {
  Draft: 'gray',
  Cancelled: 'red',
  Outstanding: 'orange',
  NotTransferred: 'orange',
  NotSaved: 'orange',
  NotSubmitted: 'orange',
  Paid: 'green',
  Saved: 'blue',
  Submitted: 'blue',
  Return: 'gray',
  ReturnIssued: 'gray',
  Unpaid: 'red',
  PartlyPaid: 'yellow',
};

function getStatus(doc: Doc) {
  if (doc.notInserted) {
    return 'Draft';
  }

  if (doc.dirty) {
    return 'NotSaved';
  }

  if (doc instanceof Party && doc.outstandingAmount?.isZero() !== true) {
    return 'Outstanding';
  }

  if (doc.schema.isSubmittable) {
    return getSubmittableStatus(doc);
  }

  return 'Saved';
}

function getSubmittableStatus(doc: Doc) {
  if (doc.isCancelled) {
    return 'Cancelled';
  }

  if (doc.returnAgainst && doc.isSubmitted) {
    return 'Return';
  }

  if (doc.isReturned && doc.isSubmitted) {
    return 'ReturnIssued';
  }

  const isInvoice = doc instanceof Invoice;

  if (doc.isSubmitted && isInvoice && (doc.stockNotTransferred ?? 0) > 0) {
    return 'NotTransferred';
  }

  if (
    doc.isSubmitted &&
    isInvoice &&
    doc.outstandingAmount?.isZero() === true
  ) {
    return 'Paid';
  }

  if (
    doc.isSubmitted &&
    isInvoice &&
    !doc.isCancelled &&
    (doc.outstandingAmount as Money)?.isPositive() &&
    (doc.outstandingAmount as Money)?.neq(doc.grandTotal as Money)
  ) {
    return 'PartlyPaid';
  }

  if (
    doc.isSubmitted &&
    isInvoice &&
    !doc.isCancelled &&
    (doc.outstandingAmount as Money)?.eq(doc.grandTotal as Money)
  ) {
    return 'Unpaid';
  }

  if (
    doc.isSubmitted &&
    isInvoice &&
    doc.outstandingAmount?.isZero() !== true
  ) {
    return 'Outstanding';
  }

  if (doc.isSubmitted) {
    return 'Submitted';
  }

  return 'NotSubmitted';
}
</script>
