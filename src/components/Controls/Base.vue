<template>
  <div :title="df.label">
    <div :class="labelClasses" v-if="showLabel">
      {{ df.label }}
    </div>
    <div :class="showMandatory ? 'show-mandatory' : ''">
      <input
        spellcheck="false"
        ref="input"
        class="bg-transparent"
        :class="[inputClasses, containerClasses]"
        :type="inputType"
        :value="value"
        :placeholder="inputPlaceholder"
        :readonly="isReadOnly"
        :step="step"
        :max="df.maxvalue"
        :min="df.minvalue"
        :style="containerStyles"
        @blur="(e) => !isReadOnly && triggerChange(e.target.value)"
        @focus="(e) => !isReadOnly && $emit('focus', e)"
        @input="(e) => !isReadOnly && $emit('input', e)"
        :tabindex="isReadOnly ? '-1' : '0'"
      />
    </div>
  </div>
</template>

<script>
import { isNumeric } from 'src/utils';
import { evaluateReadOnly, evaluateRequired } from 'src/utils/doc';
import { getIsNullOrUndef } from 'utils/index';

export default {
  name: 'Base',
  props: {
    df: Object,
    step: { type: Number, default: 1 },
    value: [String, Number, Boolean, Object],
    inputClass: [Function, String, Object],
    border: { type: Boolean, default: false },
    placeholder: String,
    size: String,
    showLabel: Boolean,
    autofocus: Boolean,
    containerStyles: { type: Object, default: () => ({}) },
    textRight: { type: [null, Boolean], default: null },
    readOnly: { type: [null, Boolean], default: null },
    required: { type: [null, Boolean], default: null },
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
    labelClasses() {
      return 'text-gray-600 text-sm mb-1';
    },
    inputClasses() {
      /**
       * These classes will be used by components that extend Base
       */

      const classes = [];

      classes.push(this.baseInputClasses);
      if (this.textRight ?? isNumeric(this.df)) {
        classes.push('text-end');
      }

      classes.push(this.sizeClasses);
      classes.push(this.inputReadOnlyClasses);

      return this.getInputClassesFromProp(classes).filter(Boolean);
    },
    baseInputClasses() {
      return [
        'text-base',
        'focus:outline-none',
        'w-full',
        'placeholder-gray-500',
      ];
    },
    sizeClasses() {
      if (this.size === 'small') {
        return 'px-2 py-1';
      }
      return 'px-3 py-2';
    },
    inputReadOnlyClasses() {
      if (this.isReadOnly) {
        return 'text-gray-800 cursor-default';
      }

      return 'text-gray-900';
    },
    containerClasses() {
      /**
       * Used to accomodate extending compoents where the input is contained in
       * a div eg AutoComplete
       */
      const classes = [];
      classes.push(this.baseContainerClasses);
      classes.push(this.containerReadOnlyClasses);
      classes.push(this.borderClasses);
      return classes.filter(Boolean);
    },
    baseContainerClasses() {
      return ['rounded'];
    },
    containerReadOnlyClasses() {
      if (!this.isReadOnly) {
        return 'focus-within:bg-gray-100';
      }

      return '';
    },
    borderClasses() {
      if (!this.border) {
        return '';
      }

      const border = 'border border-gray-200';
      let background = 'bg-gray-25';
      if (this.isReadOnly) {
        background = 'bg-gray-50';
      }

      return border + ' ' + background;
    },
    inputPlaceholder() {
      return this.placeholder || this.df.placeholder || this.df.label;
    },
    showMandatory() {
      return this.isEmpty && this.isRequired;
    },
    isEmpty() {
      if (Array.isArray(this.value) && !this.value.length) {
        return true;
      }

      if (typeof this.value === 'string' && !this.value) {
        return true;
      }

      if (getIsNullOrUndef(this.value)) {
        return true;
      }

      return false;
    },
    isReadOnly() {
      if (typeof this.readOnly === 'boolean') {
        return this.readOnly;
      }

      return evaluateReadOnly(this.df, this.doc);
    },
    isRequired() {
      if (typeof this.required === 'boolean') {
        return this.required;
      }

      return evaluateRequired(this.df, this.doc);
    },
  },
  methods: {
    getInputClassesFromProp(classes) {
      if (!this.inputClass) {
        return classes;
      }

      if (typeof this.inputClass === 'function') {
        classes = this.inputClass(classes);
      } else {
        classes.push(this.inputClass);
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
