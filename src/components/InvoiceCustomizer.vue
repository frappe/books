<template>
  <div>
    <div v-if="doc" class="p-4">
      <div class="row">
        <div class="col-6 text-center">
          <h4>Customize</h4>
        </div>
        <div class="col-6 text-right">
          <f-button secondary @click="saveAndClose">{{ _('Save & Close') }}</f-button>
        </div>
      </div>
      <div class="row">
        <div class="col-12 mt-4">
          <form-layout :doc="doc" :fields="fields" @updateDoc="saveDoc" />
          <sketch-picker v-model="color" class="shadow-none" />
          <div class="mt-3">
            <f-button secondary @click="openCompanySettings">{{ _('Company Settings') }}</f-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import FormLayout from 'frappejs/ui/components/Form/FormLayout';
import { Sketch } from 'vue-color';

export default {
  name: 'InvoiceCustomizer',
  components: {
    FormLayout,
    'sketch-picker': Sketch
  },
  data() {
    return {
      doc: null,
      fields: [],
      color: {}
    };
  },
  async created() {
    this.doc = await frappe.getDoc('SalesInvoiceSettings');
    this.color.hex = this.doc.themeColor;
    const meta = frappe.getMeta('SalesInvoiceSettings');
    this.fields = meta.fields.filter(
      field => field.fieldname !== 'numberSeries'
    );
  },
  methods: {
    async saveDoc(updatedValue) {
      let { fieldname, value } = updatedValue;
      if (fieldname === 'template') {
        this.$emit('changeTemplate', value);
      } else if (fieldname === 'font') {
        this.$emit('changeFont', value);
      }
    },
    async saveAndClose() {
      this.doc.themeColor = this.color.hex;
      await this.doc.update();
      this.$emit('closeInvoiceCustomizer');
    },
    async openCompanySettings() {
      const settings = await frappe.getSingle('CompanySettings');
      settings.on('afterSave', async () => {
        this.$formModal.close();
        this.$emit('updateTemplateView');
      });
      this.$formModal.open(settings);
    }
  },
  watch: {
    color: async function() {
      if (this.doc) {
        if (this.doc.themeColor != this.color.hex) {
          this.$emit('changeColor', this.color.hex);
        }
      }
    }
  }
};
</script>
