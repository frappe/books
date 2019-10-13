<template>
  <div class="flex flex-col">
    <PageHeader>
      <a class="cursor-pointer font-semibold" slot="title" @click="$router.go(-1)">{{ _('Back') }}</a>
      <template slot="actions">
        <Button class="text-gray-900 text-xs">{{ _('Customise') }}</Button>
        <Button
          v-if="doc._notInserted || doc._dirty"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSaveClick"
        >{{ _('Save') }}</Button>
        <Button
          v-if="!doc._dirty && !doc._notInserted && !doc.submitted"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSubmitClick"
        >{{ _('Submit') }}</Button>
      </template>
    </PageHeader>
    <div
      class="flex justify-center flex-1 mb-8 mt-6"
      v-if="meta"
      :class="doc.submitted && 'pointer-events-none'"
    >
      <div class="border rounded shadow h-full flex flex-col justify-between" style="width: 600px">
        <div>
          <div class="px-6 pt-6">
            <div class="flex text-xs text-gray-600 border-b pb-4">
              <div class="w-1/3">
                <svg class="w-32" viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#1F7AE0" fill-rule="nonzero">
                    <path
                      d="M6.032 18.953l-4.356-2.088a.401.401 0 01-.162-.582l2.181-3.2a.413.413 0 01.72.073l2.18 5.284c.071.157.032.34-.095.457a.407.407 0 01-.468.056zm14.967-.95V7.185a.404.404 0 00-.198-.344.412.412 0 00-.4-.012l-9.678 4.93a.4.4 0 00-.22.356v10.818a.404.404 0 00.198.344.412.412 0 00.4.012l9.681-4.93a.4.4 0 00.217-.356zm-2.832-4.176a4.924 4.924 0 01-2.423 4.023c-1.335.68-2.418-.017-2.417-1.559a4.924 4.924 0 012.423-4.024c1.335-.68 2.417.02 2.417 1.56zm-8.06-3.505L19.7 5.46a.4.4 0 00-.008-.716L10.18.166a.416.416 0 00-.368 0L.22 5.03a.4.4 0 00.008.716l9.514 4.576c.115.056.25.056.365 0v.001zm-.03-7.407l4.054 1.95a.4.4 0 01.007.716l-3.932 1.993a.419.419 0 01-.37 0l-4.052-1.95a.4.4 0 01-.007-.715l3.931-1.994a.418.418 0 01.37 0zM32.663 18.123a6.095 6.095 0 01-3.44-1.057c-.159-.113-.294-.315-.181-.54l.475-.968c.113-.225.407-.293.679-.135.611.337 1.358.765 2.603.765.882 0 1.38-.428 1.38-1.013 0-.697-.792-1.147-2.24-1.8-1.607-.72-2.83-1.575-2.83-3.285 0-1.306.929-2.836 3.463-2.836 1.449 0 2.535.428 3.056.765.249.18.362.495.226.765l-.362.72c-.159.315-.475.293-.68.203-.723-.315-1.425-.518-2.24-.518-.905 0-1.335.45-1.335.923 0 .675.747 1.08 1.788 1.53 1.924.81 3.372 1.508 3.372 3.443 0 1.62-1.403 3.038-3.734 3.038zm6.133-.742V7.974c0-.247.226-.495.498-.495h.52c.25 0 .385.113.453.315l.294.9a4.461 4.461 0 013.327-1.44c1.517 0 2.422.585 3.192 1.643.294-.293 1.538-1.643 3.53-1.643 3.191 0 3.983 2.205 3.983 4.906v5.22c0 .27-.203.496-.498.496h-1.267c-.317 0-.498-.225-.498-.495V12.07c0-1.665-.634-2.678-2.06-2.678-1.584 0-2.33 1.058-2.512 1.215.046.225.091.855.091 1.395v5.379c0 .27-.226.495-.475.495h-1.29a.487.487 0 01-.498-.495V12.07c0-1.688-.611-2.678-2.06-2.678-1.561 0-2.353 1.148-2.467 1.508v6.48c0 .27-.249.496-.498.496h-1.267a.5.5 0 01-.498-.495zm18.06-2.723c0-1.913 1.494-3.353 4.187-3.353 1.087 0 2.105.315 2.105.315.046-1.643-.362-2.386-1.675-2.386-1.199 0-2.376.338-2.919.495-.317.068-.52-.135-.588-.427l-.204-.855c-.068-.36.09-.518.34-.608.18-.067 1.674-.585 3.598-.585 3.35 0 3.666 2.003 3.666 4.59v5.537c0 .27-.249.495-.498.495h-.747c-.203 0-.316-.09-.43-.36l-.249-.698c-.565.54-1.606 1.305-3.213 1.305-1.97 0-3.372-1.305-3.372-3.465zm2.218-.023c0 .923.544 1.643 1.63 1.643 1.041 0 2.105-.743 2.422-1.26v-1.733c-.136-.09-.95-.36-1.901-.36-1.223 0-2.15.63-2.15 1.71zm9.438 2.746V4.618c0-.247.226-.495.498-.495h1.267c.25 0 .498.248.498.495v12.763c0 .27-.249.495-.498.495H69.01a.5.5 0 01-.498-.495zm5.568 0V4.618c0-.247.226-.495.497-.495h1.268c.249 0 .498.248.498.495v12.763c0 .27-.25.495-.498.495h-1.268a.5.5 0 01-.497-.495zm4.843-4.681c0-3.06 2.467-5.446 5.364-5.446 1.63 0 2.829.608 3.802 1.8.203.248.136.54-.09.743l-.815.743c-.295.27-.498.067-.68-.113-.475-.517-1.312-1.035-2.15-1.035-1.787 0-3.168 1.44-3.168 3.285 0 1.868 1.358 3.308 3.1 3.308 1.359 0 1.902-.765 2.468-1.282.226-.225.475-.225.701-.045l.702.562c.249.225.362.473.18.743-.86 1.283-2.262 2.16-4.073 2.16-2.92 0-5.341-2.295-5.341-5.423zm10.999 1.958c0-1.913 1.494-3.353 4.187-3.353 1.086 0 2.105.315 2.105.315.045-1.643-.362-2.386-1.675-2.386-1.2 0-2.376.338-2.92.495-.316.068-.52-.135-.588-.427l-.204-.855c-.068-.36.09-.518.34-.608.18-.067 1.675-.585 3.598-.585 3.35 0 3.667 2.003 3.667 4.59v5.537c0 .27-.25.495-.498.495h-.747c-.204 0-.317-.09-.43-.36l-.25-.698c-.565.54-1.606 1.305-3.213 1.305-1.969 0-3.372-1.305-3.372-3.465zm2.218-.023c0 .923.543 1.643 1.63 1.643 1.04 0 2.104-.743 2.421-1.26v-1.733c-.136-.09-.95-.36-1.901-.36-1.222 0-2.15.63-2.15 1.71zm12.38 3.488a6.095 6.095 0 01-3.44-1.057c-.159-.113-.295-.315-.181-.54l.475-.968c.113-.225.407-.293.679-.135.61.337 1.358.765 2.602.765.883 0 1.381-.428 1.381-1.013 0-.697-.792-1.147-2.24-1.8-1.607-.72-2.83-1.575-2.83-3.285 0-1.306.928-2.836 3.463-2.836 1.449 0 2.535.428 3.055.765.25.18.363.495.227.765l-.362.72c-.159.315-.476.293-.68.203-.724-.315-1.425-.518-2.24-.518-.905 0-1.335.45-1.335.923 0 .675.747 1.08 1.788 1.53 1.924.81 3.372 1.508 3.372 3.443 0 1.62-1.403 3.038-3.734 3.038zm5.5-5.446c0-2.925 2.059-5.423 5.205-5.423 2.715 0 4.775 2.003 4.775 4.77 0 .18-.023.54-.045.72a.487.487 0 01-.476.451h-7.22c.023 1.395 1.29 2.835 3.124 2.835 1.2 0 1.924-.427 2.557-.877.227-.158.43-.225.612.045l.61.945c.182.225.272.428-.045.698-.747.652-2.127 1.282-3.87 1.282-3.168 0-5.228-2.475-5.228-5.446zm2.353-1.147h5.386c-.045-1.26-1.04-2.363-2.58-2.363-1.652 0-2.648 1.058-2.806 2.363z"
                    />
                  </g>
                </svg>
              </div>
              <div class="w-1/3">
                <div>adickens@gmail.com</div>
                <div>02002 5798368</div>
              </div>
              <div class="w-1/3">
                <div>9086 Jerde Street, Port Coralie, AR 89317-0033</div>
              </div>
            </div>
          </div>
          <div class="mt-8 px-6">
            <div class="flex justify-between">
              <div class="w-1/3">
                <h1 class="text-2xl font-semibold">Invoice</h1>
                <FormControl
                  class="mt-2"
                  :df="meta.getField('date')"
                  :value="doc.date"
                  :placeholder="'Date'"
                  @change="value => doc.set('date', value)"
                  input-class="bg-gray-100 rounded-lg px-3 py-2 text-sm"
                />
                <FormControl
                  class="mt-2"
                  :df="meta.getField('account')"
                  :value="doc.account"
                  :placeholder="'Account'"
                  @change="value => doc.set('account', value)"
                  input-class="bg-gray-100 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div class="w-1/3">
                <FormControl
                  :df="meta.getField(partyField.fieldname)"
                  :value="doc[partyField.fieldname]"
                  :placeholder="partyField.label"
                  @change="value => doc.set(partyField.fieldname, value)"
                  @new-doc="doc => doc.set(partyField.fieldname, doc.name)"
                  input-class="bg-gray-100 rounded-lg p-2 text-right"
                />
                <div
                  class="mt-1 text-xs text-gray-600 text-right"
                >9115 Francesco Valley, Port Christophe, NH 96860-1674</div>
                <div class="mt-1 text-xs text-gray-600 text-right">GSTIN: 27MHCQ04111A2Z5</div>
              </div>
            </div>
          </div>
          <div class="px-6 text-sm">
            <FormControl
              :df="meta.getField('items')"
              :value="doc.items"
              :showHeader="true"
              @change="value => doc.set('items', value)"
            />
          </div>
        </div>
        <div class="px-6 mb-6 flex justify-end text-sm">
          <div class="w-64">
            <div class="flex pl-2 justify-between py-3 border-b">
              <div>Subtotal</div>
              <div>{{ doc.netTotal }}</div>
            </div>
            <div class="flex pl-2 justify-between py-3" v-for="tax in doc.taxes" :key="tax.name">
              <div>{{ tax.account }} ({{ tax.rate }}%)</div>
              <div>{{ tax.amount }}</div>
            </div>
            <div
              class="flex pl-2 justify-between py-3 border-t text-green-600 font-semibold text-base"
            >
              <div>Grand Total</div>
              <div>{{ doc.grandTotal }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import FormControl from '@/components/Controls/FormControl';
import Row from '@/components/Row';
import AddIcon from '@/components/Icons/Add';

export default {
  name: 'InvoiceForm',
  props: ['doctype', 'name'],
  components: {
    PageHeader,
    Button,
    FormControl,
    Row,
    AddIcon
  },
  provide() {
    return {
      doctype: this.doctype,
      name: this.name
    };
  },
  data() {
    return {
      meta: null,
      itemsMeta: null,
      doc: {}
    };
  },
  computed: {
    itemTableFields() {
      return this.itemsMeta.tableFields.map(fieldname =>
        this.itemsMeta.getField(fieldname)
      );
    },
    itemTableColumnRatio() {
      return [0.3].concat(this.itemTableFields.map(_ => 1));
    },
    partyField() {
      let fieldname = {
        SalesInvoice: 'customer',
        PurchaseInvoice: 'supplier'
      }[this.doctype];
      return this.meta.getField(fieldname);
    },
  },
  async mounted() {
    this.meta = frappe.getMeta(this.doctype);
    this.itemsMeta = frappe.getMeta(`${this.doctype}Item`);
    this.doc = await frappe.getDoc(this.doctype, this.name);
    window.si = this.doc;
  },
  methods: {
    async addNewItem() {
      this.doc.append('items');
    },
    async onSaveClick() {
      await this.doc.set('items', this.doc.items.filter(row => row.item));

      if (this.doc.isNew()) {
        this.doc.insert();
      } else {
        this.doc.update();
      }
    },
    async onSubmitClick() {
      await this.doc.submit();
    }
  }
};
</script>
