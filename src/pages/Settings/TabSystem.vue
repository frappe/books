<template>
  <div class="flex flex-col justify-between h-full">
    <TwoColumnForm
      v-if="doc"
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :emit-change="true"
      @change="forwardChangeEvent"
    />
    <div class="flex flex-row justify-between items-center w-full">
      <div class="flex items-center rounded-lg">
        <FormControl
          :df="anonymizedTelemetryDf"
          :showLabel="true"
          :value="anonymizedTelemetry"
          @change="setAnonymizedTelemetry"
          class="border-r pr-4"
          :label-right="false"
        />
        <LanguageSelector class="text-sm w-28" input-class="px-4 py-1.5" />
      </div>
      <button
        class="
          text-gray-900 text-sm
          bg-gray-100
          hover:bg-gray-200
          rounded-md
          px-4
          py-1.5
        "
        @click="checkForUpdates(true)"
      >
        Check for Updates
      </button>
    </div>
  </div>
</template>

<script>
import FormControl from '@/components/Controls/FormControl';
import LanguageSelector from '@/components/Controls/LanguageSelector.vue';
import TwoColumnForm from '@/components/TwoColumnForm';
import config, { ConfigKeys } from '@/config';
import { checkForUpdates } from '@/utils';
import frappe from 'frappe';

export default {
  name: 'TabSystem',
  components: {
    FormControl,
    TwoColumnForm,
    LanguageSelector,
  },
  emits: ['change'],
  data() {
    return {
      doc: null,
      anonymizedTelemetry: 0,
    };
  },
  watch: {
    anonymizedTelemetry(newValue) {
      config.set(ConfigKeys.AnonymizedTelemetry, !!newValue);
    },
  },
  async mounted() {
    this.doc = frappe.SystemSettings;
    this.companyName = frappe.AccountingSettings.companyName;
    this.anonymizedTelemetry = Number(
      config.get(ConfigKeys.AnonymizedTelemetry)
    );
  },
  computed: {
    anonymizedTelemetryDf() {
      return {
        fieldname: 'anonymizedTelemetry',
        label: this.t`Anonymized Telemetry`,
        fieldtype: 'Check',
        default: 0,
        description: this
          .t`Send anonymized usage data and error reports to help improve the product.`,
      };
    },
    fields() {
      let meta = frappe.getMeta('SystemSettings');
      return meta.getQuickEditFields();
    },
  },
  methods: {
    checkForUpdates,
    setAnonymizedTelemetry(value) {
      this.anonymizedTelemetry = value;
    },
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
