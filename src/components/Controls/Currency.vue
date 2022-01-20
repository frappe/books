<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <input
      v-show="showInput"
      ref="input"
      :class="inputClasses"
      :type="inputType"
      :value="value.round()"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      @blur="onBlur"
      @focus="onFocus"
      @input="(e) => $emit('input', e)"
    />
    <div
      v-show="!showInput"
      :class="[inputClasses, 'cursor-text']"
      @click="activateInput"
      @focus="activateInput"
      tabindex="0"
    >
      {{ formattedValue }}
    </div>
  </div>
</template>

<script>
import frappe from 'frappe';
import Float from './Float';

export default {
  name: 'Currency',
  extends: Float,
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
    parse(value) {
      return frappe.pesa(value);
    },
    onBlur(e) {
      let { value } = e.target;
      if (value !== 0 && !value) {
        value = frappe.pesa(0).round();
      }

      this.showInput = false;
      this.triggerChange(value);
    },
    activateInput() {
      this.showInput = true;
      this.$nextTick(() => {
        this.focus();
      });
    },
  },
  computed: {
    formattedValue() {
      return frappe.format(this.value, this.df, this.doc);
    },
  },
};
</script>
