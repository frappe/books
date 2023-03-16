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
      :value="value?.round()"
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

<script>
import { fyo } from 'src/initFyo';
import { nextTick } from 'vue';
import Float from './Float.vue';

export default {
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
    parse(value) {
      return fyo.pesa(value);
    },
    onBlur(e) {
      let { value } = e.target;
      if (value !== 0 && !value) {
        value = fyo.pesa(0).round();
      }

      this.showInput = false;
      this.triggerChange(value);
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
};
</script>
