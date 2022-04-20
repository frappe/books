<template>
  <Modal :open-modal="shouldOpen" class="p-6 flex flex-col gap-3 text-gray-900">
    <div class="flex justify-between">
      <h1 class="font-bold text-md">{{ t`Set Anonymized Telemetry` }}</h1>
      <button @click="shouldOpen = false">
        <FeatherIcon name="x" class="w-5 h-5 text-gray-600" />
      </button>
    </div>
    <p class="text-base mt-4">
      {{ t`Hello there! 👋` }}
    </p>
    <p class="text-base">
      {{
        t`Frappe Books uses opt-in telemetry. This is the only way for us to know if we have any consistent
        users. It will be really helpful if you switch it on, but we won't force you. 🙂`
      }}
    </p>
    <p class="text-base mt-4">
      {{ t`Please select an option:` }}
    </p>
    <FormControl
      :df="df"
      class="text-sm border rounded-md"
      @change="
        (v) => {
          value = v;
        }
      "
      :value="value"
    />
    <p class="text-base text-gray-800">{{ description }}</p>
    <div class="flex flex-row w-full justify-between items-center mt-12">
      <HowTo
        link="https://github.com/frappe/books/wiki/Anonymized-Opt-In-Telemetry"
        class="text-sm hover:text-gray-900 text-gray-800 py-1 justify-between"
        :icon="false"
        >{{ t`Know More` }}</HowTo
      >

      <Button
        class="text-sm w-32"
        type="primary"
        :disabled="!isSet"
        @click="saveClicked"
        >{{ t`Save Option` }}</Button
      >
    </div>
  </Modal>
</template>

<script>
import config, { ConfigKeys, TelemetrySetting } from 'src/config';
import { getTelemetryOptions } from 'src/telemetry/helpers';
import telemetry from 'src/telemetry/telemetry';
import { NounEnum, Verb } from 'src/telemetry/types';
import Button from '../Button.vue';
import FormControl from '../Controls/FormControl';
import FeatherIcon from '../FeatherIcon.vue';
import HowTo from '../HowTo.vue';
import Modal from '../Modal.vue';

export default {
  components: { Modal, FormControl, Button, HowTo, FeatherIcon },
  data() {
    return {
      shouldOpen: false,
      value: '',
    };
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
    description() {
      if (!this.isSet) {
        return '';
      }

      return {
        [TelemetrySetting.allow]: this
          .t`Enables telemetry. Includes usage patterns.`,
        [TelemetrySetting.dontLogUsage]: this
          .t`Enables telemetry. Does not include usage patterns.`,
        [TelemetrySetting.dontLogAnything]: this
          .t`Disables telemetry. No data will be collected, you are completely invisble to us.`,
      }[this.value];
    },
    isSet() {
      return this.getIsSet(this.value);
    },
  },
  methods: {
    saveClicked() {
      if (this.value === TelemetrySetting.dontLogUsage) {
        telemetry.finalLogAndStop();
      } else {
        telemetry.log(Verb.Started, NounEnum.Telemetry);
      }

      config.set(ConfigKeys.Telemetry, this.value);
      this.shouldOpen = false;
    },
    getIsSet(value) {
      return [
        TelemetrySetting.allow,
        TelemetrySetting.dontLogAnything,
        TelemetrySetting.dontLogUsage,
      ].includes(value);
    },

    setOpen(telemetry) {
      const openCount = config.get(ConfigKeys.OpenCount);
      this.shouldOpen = !this.getIsSet(telemetry) && openCount >= 4;
    },
  },
  mounted() {
    const telemetry = config.get(ConfigKeys.Telemetry);
    this.setOpen(telemetry);
    this.value = telemetry;
  },
};
</script>
