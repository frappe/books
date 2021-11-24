<template>
  <div>
    <TwoColumnForm v-if="doc" :doc="doc" :fields="fields" :autosave="true" />
    <div class="mt-6">
      <FormControl
        :show-label="true"
        :df="AccountingSettings.meta.getField('autoUpdate')"
        @change="(value) => AccountingSettings.update('autoUpdate', value)"
        :value="AccountingSettings.autoUpdate"
      />
      <p class="pl-6 mt-1 text-sm text-gray-600">
        <!-- prettier-ignore -->
        {{ _('Automatically check for updates and download them if available. The update will be applied after you restart the app.') }}
      </p>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import TwoColumnForm from '@/components/TwoColumnForm';
import FormControl from '@/components/Controls/FormControl';

export default {
  name: 'TabSystem',
  components: {
    TwoColumnForm,
    FormControl,
  },
  data() {
    return {
      doc: null,
    };
  },
  async mounted() {
    this.doc = frappe.SystemSettings;
    this.companyName = frappe.AccountingSettings.companyName;
  },
  computed: {
    fields() {
      let meta = frappe.getMeta('SystemSettings');
      return meta.getQuickEditFields();
    },
    AccountingSettings() {
      return frappe.AccountingSettings;
    },
  },
};
</script>
