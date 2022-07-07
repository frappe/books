<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <input
      spellcheck="false"
      ref="input"
      :class="inputClasses"
      :type="inputType"
      :value="value"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      :max="df.maxvalue"
      :min="df.minvalue"
      @blur="(e) => !isReadOnly && triggerChange(e.target.value)"
      @focus="(e) => !isReadOnly && $emit('focus', e)"
      @input="(e) => !isReadOnly && $emit('input', e)"
    />
  </div>
</template>

<script>
import { isNumeric } from 'src/utils';

export default {
  name: 'Base',
  props: {
    df: Object,
    value: [String, Number, Boolean, Object],
    inputClass: [Function, String, Object],
    placeholder: String,
    size: String,
    showLabel: Boolean,
    readOnly: Boolean,
    autofocus: Boolean,
  },
  emits: ['focus', 'input', 'change'],
  inject: {
    schemaName: {
      default: null,
    },
    name: {
      default: null,
    },
    doc: {
      default: null,
    },
  },
  mounted() {
    if (this.autofocus) {
      this.focus();
    }
  },
  computed: {
    inputType() {
      return 'text';
    },
    inputClasses() {
      let classes = [
        {
          'px-3 py-2': this.size !== 'small',
          'px-2 py-1': this.size === 'small',
        },
        'focus:outline-none focus:bg-gray-200 rounded w-full placeholder-gray-400',
        this.isReadOnly ? 'text-gray-800' : 'text-gray-900',
      ];

      return this.getInputClassesFromProp(classes);
    },
    inputPlaceholder() {
      return this.placeholder || this.df.placeholder || this.df.label;
    },
    isReadOnly() {
      if (this.readOnly != null) {
        return this.readOnly;
      }
      return this.df.readOnly;
    },
  },
  methods: {
    getInputClassesFromProp(classes) {
      if (this.inputClass) {
        if (typeof this.inputClass === 'function') {
          classes = this.inputClass(classes);
        } else {
          classes.push(this.inputClass);
        }
      }
      return classes;
    },
    focus() {
      if (this.$refs.input && this.$refs.input.focus) {
        this.$refs.input.focus();
      }
    },
    triggerChange(value) {
      value = this.parse(value);

      if (value === '') {
        value = null;
      }

      this.$emit('change', value);
    },
    parse(value) {
      return value;
    },
    isNumeric,
  },
};
</script>

<style>
input[type='number']::-webkit-inner-spin-button {
  appearance: none;
}
</style>
