<template>
  <div>
    <div :class="labelClasses" v-if="showLabel">
      {{ df.label }}
    </div>
    <input
      v-show="showInput"
      ref="input"
      :class="[inputClasses, containerClasses]"
      :type="inputType"
      :value="inputValue"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      :tabindex="isReadOnly ? '-1' : '0'"
      @blur="onBlur"
      @focus="onFocus"
      @input="(e) => $emit('input', e)"
    />
    <div
      v-show="!showInput"
      class="flex"
      :class="[containerClasses, sizeClasses]"
      @click="activateInput"
      @focus="activateInput"
      tabindex="0"
    >
      <p
        :class="[baseInputClasses]"
        class="overflow-auto no-scrollbar whitespace-nowrap"
        v-if="!isEmpty"
      >
        {{ formattedValue }}
      </p>
      <p v-else-if="inputPlaceholder" class="text-base text-gray-500 w-full">
        {{ inputPlaceholder }}
      </p>

      <button v-if="!isReadOnly" class="-me-0.5 ms-1">
        <FeatherIcon
          name="calendar"
          class="w-4 h-4"
          :class="showMandatory ? 'text-red-600' : 'text-gray-600'"
        />
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { fyo } from 'src/initFyo';
import { defineComponent, nextTick } from 'vue';
import Base from './Base.vue';

export default defineComponent({
  extends: Base,
  emits: ['input', 'focus'],
  data() {
    return {
      showInput: false,
    };
  },
  methods: {
    onFocus(e: FocusEvent) {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      target.select();
      this.showInput = true;
      this.$emit('focus', e);
    },
    onBlur(e: FocusEvent) {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      this.showInput = false;
      let value: Date | null = new Date(target.value);
      if (Number.isNaN(value.valueOf())) {
        value = null;
      }

      this.triggerChange(value);
    },
    activateInput() {
      if (this.isReadOnly) {
        return;
      }

      this.showInput = true;
      nextTick(() => {
        this.focus();

        // @ts-ignore
        this.$refs.input.showPicker();
      });
    },
  },
  computed: {
    inputValue(): string {
      let value = this.value;
      if (typeof value === 'string') {
        value = new Date(value);
      }

      if (value instanceof Date && !Number.isNaN(value.valueOf())) {
        return value.toISOString().split('T')[0];
      }

      return '';
    },
    inputType() {
      return 'date';
    },
    formattedValue() {
      const value = this.parse(this.value);
      return fyo.format(value, this.df, this.doc);
    },
    borderClasses(): string {
      if (!this.border) {
        return '';
      }

      const border = 'border border-gray-200';
      let background = 'bg-gray-25';
      if (this.isReadOnly) {
        background = 'bg-gray-50';
      }

      if (this.showInput) {
        return background;
      }

      return border + ' ' + background;
    },
  },
});
</script>
