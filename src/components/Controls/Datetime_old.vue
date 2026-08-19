<template>
  <Popover>
    <!-- Datetime Selected Display -->
    <template #target="{ togglePopover }">
      <div v-if="showLabel" :class="labelClasses">
        {{ df?.label }}
      </div>
      <div
        :class="[containerClasses, sizeClasses]"
        class="flex"
        @click="() => !isReadOnly && togglePopover()"
      >
        <p
          v-if="!isEmpty"
          :class="[baseInputClasses]"
          class="overflow-auto no-scrollbar whitespace-nowrap"
        >
          {{ formattedValue }}
        </p>
        <p v-else-if="inputPlaceholder" class="text-base text-gray-500 w-full">
          {{ inputPlaceholder }}
        </p>

        <button v-if="!isReadOnly" class="p-0.5 rounded -me-1 ms-1">
          <FeatherIcon
            name="calendar"
            class="w-4 h-4"
            :class="showMandatory ? 'text-red-600' : 'text-gray-600'"
          />
        </button>
      </div>
    </template>

    <!-- Datetime Input Popover -->
    <template #content>
      <DatetimePicker
        :show-clear="!isRequired"
        :select-time="selectTime"
        :model-value="internalValue"
        :format-value="formatValue"
        @update:model-value="(value) => triggerChange(value)"
      />
    </template>
  </Popover>
</template>

<script lang="ts">
/**
 * This is a Datetime/Date component that builds
 * uses a custom DatetimePicker. It is not being used
 * for now because users are more familiar with their
 * system's date and datetime picker.
 *
 * That provides better UX.
 *
 * This component can be used once the underlying
 * DatetimePicker's UX issues are solved.
 */

import { Field } from 'schemas/types';
import { defineComponent, PropType } from 'vue';
import DatetimePicker from './DatetimePicker.vue';
import FeatherIcon from '../FeatherIcon.vue';
import Popover from '../Popover.vue';
import Base from './Base.vue';

export default defineComponent({
  components: { Popover, FeatherIcon, DatetimePicker },
  extends: Base,
  props: { value: [Date, String], df: Object as PropType<Field> },
  data() {
    return { selectTime: true };
  },
  computed: {
    internalValue() {
      if (this.value == null) {
        return undefined;
      }

      if (typeof this.value === 'string') {
        return new Date(this.value);
      }

      return this.value;
    },
    formattedValue() {
      return this.formatValue(this.internalValue);
    },
  },
  methods: {
    triggerChange(value: Date | null) {
      this.$emit('change', value);
    },
    formatValue(value?: Date | null) {
      if (value == null) {
        return '';
      }

      return this.fyo.format(
        value,
        this.df ?? (this.selectTime ? 'Datetime' : 'Date')
      );
    },
  },
});
</script>
