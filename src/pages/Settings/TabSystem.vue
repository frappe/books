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
        {{ t`Check for Updates` }}
      </button>
    </div>
  </div>
</template>

<script>
import { ConfigKeys } from 'fyo/core/types';
import { getTelemetryOptions } from 'fyo/telemetry/helpers';
import { TelemetrySetting } from 'fyo/telemetry/types';
import FormControl from 'src/components/Controls/FormControl';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import TwoColumnForm from 'src/components/TwoColumnForm';
import { fyo } from 'src/initFyo';
import { checkForUpdates } from 'src/utils';

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
    this.doc = fyo.singles.SystemSettings;
    this.companyName = fyo.singles.AccountingSettings.companyName;
    this.telemetry = fyo.config.get(ConfigKeys.Telemetry);
  },
  computed: {
    df() {
      const telemetryOptions = getTelemetryOptions();
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
      let meta = fyo.getMeta('SystemSettings');
      return meta.getQuickEditFields();
    },
  },
  methods: {
    checkForUpdates,
    setValue(value) {
      this.telemetry = value;
      if (value === TelemetrySetting.dontLogAnything) {
        fyo.telemetry.finalLogAndStop();
      } else {
        fyo.telemetry.log(Verb.Started, NounEnum.Telemetry);
      }

      fyo.config.set(ConfigKeys.Telemetry, value);
    },
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
