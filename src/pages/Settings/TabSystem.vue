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
    <div class="flex p-4 justify-between">
      <LanguageSelector class="text-sm w-28" />
      <p class="mt-auto text-gray-600 text-base select-none">
        {{ `v${fyo.store.appVersion}` }}
      </p>
    </div>
  </div>
</template>

<script>
import { ConfigKeys } from 'fyo/core/types';
import { ModelNameEnum } from 'models/types';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import TwoColumnForm from 'src/components/TwoColumnForm';
import { fyo } from 'src/initFyo';
import { getCountryInfo } from 'utils/misc';

export default {
  name: 'TabSystem',
  components: {
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
    window.gci = getCountryInfo;
  },
  computed: {
    fields() {
      return fyo.schemaMap.SystemSettings.quickEditFields.map((f) =>
        fyo.getField(ModelNameEnum.SystemSettings, f)
      );
    },
  },
  methods: {
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
