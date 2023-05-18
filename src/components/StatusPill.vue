<template>
  <p class="pill font-medium" :class="styleClass">{{ text }}</p>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { Party } from 'models/baseModels/Party/Party';
import { PurchaseInvoice } from 'models/baseModels/PurchaseInvoice/PurchaseInvoice';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { Money } from 'pesa';
import { getBgTextColorClass } from 'src/utils/colors';
import { defineComponent } from 'vue';

type Status = ReturnType<typeof getStatus>;
type UIColors = 'gray' | 'orange' | 'red' | 'green' | 'blue';

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
      if (
        !(this.doc.outstandingAmount as Money).isZero &&
        (this.doc.outstandingAmount as Money) < (this.doc.grandTotal as Money)
      ) {
        return 'Partly Paid';
      }

      const hasOutstanding = isPesa(this.doc.outstandingAmount);
      if (hasOutstanding && this.status === 'Outstanding') {
        const amt = this.fyo.format(this.doc.outstandingAmount, 'Currency');
        return this.t`Unpaid ${amt}`;
      }

      if (this.doc instanceof Invoice && this.status === 'NotTransferred') {
        const amt = this.fyo.format(this.doc.stockNotTransferred, 'Float');
        return this.t`Pending Qty. ${amt}`;
      }

      return {
        Draft: this.t`Draft`,
        Cancelled: this.t`Cancelled`,
        Return: this.t`Return`,
        PartlyPaid: this.t`Partly Paid`,
        CreditNoteIssued: this.t`Credit Note Issued`,
        DebitNoteIssued: this.t`Debit Note Issued`,
        Outstanding: this.t`Outstanding`,
        NotTransferred: this.t`Not Transferred`,
        NotSaved: this.t`Not Saved`,
        NotSubmitted: this.t`Not Submitted`,
        Paid: this.t`Paid`,
        Saved: this.t`Saved`,
        Submitted: this.t`Submitted`,
      }[this.status];
    },
    color(): UIColors {
      return statusColorMap[this.status];
    },
  },
});

const statusColorMap: Record<Status, UIColors> = {
  Draft: 'gray',
  Return: 'gray',
  CreditNoteIssued: 'gray',
  DebitNoteIssued: 'gray',
  Cancelled: 'red',
  Outstanding: 'orange',
  NotTransferred: 'orange',
  NotSaved: 'orange',
  NotSubmitted: 'orange',
  PartlyPaid: 'orange',
  Paid: 'green',
  Saved: 'blue',
  Submitted: 'blue',
};

function getStatus(doc: Doc) {
  if (doc.notInserted) {
    return 'Draft';
  }

  if (doc.dirty) {
    return 'NotSaved';
  }

  if (doc instanceof Invoice && doc.isSubmitted && doc.isReturn) {
    return 'Return';
  }

  if (doc instanceof SalesInvoice && doc.isSubmitted && doc.returnCompleted) {
    return 'CreditNoteIssued';
  }

  if (
    doc instanceof PurchaseInvoice &&
    doc.isSubmitted &&
    doc.returnCompleted
  ) {
    return 'DebitNoteIssued';
  }

  if (
    doc instanceof Party &&
    doc.isSubmitted &&
    !doc.isReturn &&
    (doc.outstandingAmount as Money) < (doc.grandTotal as Money)
  ) {
    return 'PartlyPaid';
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

  const isInvoice = doc instanceof Invoice;
  if (
    doc.isSubmitted &&
    isInvoice &&
    doc.outstandingAmount?.isZero() !== true
  ) {
    return 'Outstanding';
  }

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

  if (doc.isSubmitted) {
    return 'Submitted';
  }

  return 'NotSubmitted';
}
</script>
