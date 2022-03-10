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
      <div class="flex items-center">
        <FormControl
          :df="df"
          :value="telemetry"
          @change="setValue"
          class="text-sm py-0 w-44"
          :label-right="false"
        />
        <div class="border-r h-6 mx-2" />
        <LanguageSelector class="text-sm w-44" input-class="py-2" />
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
import config, { ConfigKeys, telemetryOptions } from '@/config';
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
      telemetry: '',
    };
  },
  async mounted() {
    this.doc = frappe.SystemSettings;
    this.companyName = frappe.AccountingSettings.companyName;
    this.telemetry = config.get(ConfigKeys.Telemetry);
  },
  computed: {
    df() {
      return {
        fieldname: 'anonymizedTelemetry',
        label: this.t`Anonymized Telemetry`,
        fieldtype: 'Select',
        options: Object.keys(telemetryOptions),
        map: telemetryOptions,
        default: 'allow',
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
    setValue(value) {
      this.telemetry = value;
      config.set(ConfigKeys.Telemetry, value);
    },
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
