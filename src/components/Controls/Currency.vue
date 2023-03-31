<template>
  <div>
    <div :class="labelClasses" v-if="showLabel">
      {{ df.label }}
    </div>
    <input
      v-show="showInput"
      ref="input"
      class="text-end"
      :class="[inputClasses, containerClasses]"
      :type="inputType"
      :value="round(value)"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      :tabindex="isReadOnly ? '-1' : '0'"
      @blur="onBlur"
      @focus="onFocus"
      @input="(e) => $emit('input', e)"
    />
    <div
      v-show="!showInput"
      class="whitespace-nowrap overflow-x-auto"
      :class="[inputClasses, containerClasses, ,]"
      @click="activateInput"
      @focus="activateInput"
      tabindex="0"
    >
      {{ formattedValue }}
    </div>
  </div>
</template>
<script lang="ts">
// @ts-nocheck
import { isPesa } from 'fyo/utils';
import { Money } from 'pesa';
import { fyo } from 'src/initFyo';
import { safeParseFloat } from 'utils/index';
import { defineComponent, nextTick } from 'vue';
import Float from './Float.vue';

export default defineComponent({
  name: 'Currency',
  extends: Float,
  emits: ['input', 'focus'],
  data() {
    return {
      showInput: false,
      currencySymbol: '',
    };
  },
  methods: {
    onFocus(e) {
      e.target.select();
      this.showInput = true;
      this.$emit('focus', e);
    },
    round(v: unknown) {
      if (!isPesa(v)) {
        v = this.parse(v);
      }

      if (isPesa(v)) {
        return v.round();
      }

      return fyo.pesa(0).round();
    },
    parse(value: unknown): Money {
      if (isPesa(value)) {
        return value;
      }

      if (typeof value === 'string') {
        value = safeParseFloat(value);
      }

      if (typeof value === 'number') {
        return fyo.pesa(value);
      }

      if (typeof value === 'bigint') {
        return fyo.pesa(value);
      }

      return fyo.pesa(0);
    },
    onBlur(e: FocusEvent) {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      this.showInput = false;
      this.triggerChange(target.value);
    },
    activateInput() {
      if (this.isReadOnly) {
        return;
      }

      this.showInput = true;
      nextTick(() => {
        this.focus();
      });
    },
  },
  computed: {
    formattedValue() {
      return fyo.format(this.value ?? fyo.pesa(0), this.df, this.doc);
    },
  },
});
</script>
