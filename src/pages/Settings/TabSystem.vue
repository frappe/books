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
    <div
      class="flex flex-row justify-between items-center w-full text-gray-900 p-6"
    >
      <LanguageSelector
        class="text-sm w-40 bg-gray-100 rounded-md"
        input-class="bg-transparent"
      />
      <button
        class="
          text-sm
          bg-gray-100
          hover:bg-gray-200
          rounded-md
          px-4
          h-8
          w-40
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
import { ModelNameEnum } from 'models/types';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import TwoColumnForm from 'src/components/TwoColumnForm';
import { fyo } from 'src/initFyo';
import { checkForUpdates } from 'src/utils/ipcCalls';
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
    checkForUpdates,
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
