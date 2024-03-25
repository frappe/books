<template>
  <div :title="df.label">
    <div v-if="showLabel" :class="labelClasses">
      {{ df.label }}
    </div>
    <div :class="showMandatory ? 'show-mandatory' : ''">
      <input
        ref="input"
        spellcheck="false"
        class="bg-transparent"
        :class="[inputClasses, containerClasses]"
        :type="inputType"
        :value="value"
        :placeholder="inputPlaceholder"
        :readonly="isReadOnly"
        :step="step"
        :max="isNumeric(df) ? df.maxvalue : undefined"
        :min="isNumeric(df) ? df.minvalue : undefined"
        :style="containerStyles"
        :tabindex="isReadOnly ? '-1' : '0'"
        @blur="onBlur"
        @focus="(e) => !isReadOnly && $emit('focus', e)"
        @input="(e) => !isReadOnly && $emit('input', e)"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { evaluateReadOnly, evaluateRequired } from 'src/utils/doc';
import { getIsNullOrUndef } from 'utils/index';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'Base',
  inject: {
    injectedDoc: {
      from: 'doc',
      default: undefined,
    },
  },
  props: {
    df: { type: Object as PropType<Field>, required: true },
    step: { type: Number, default: 1 },
    value: [String, Number, Boolean, Object],
    inputClass: [String, Array] as PropType<string | string[]>,
    border: { type: Boolean, default: false },
    size: { type: String, default: 'large' },
    placeholder: String,
    showLabel: { type: Boolean, default: false },
    containerStyles: { type: Object, default: () => ({}) },
    textRight: {
      type: [null, Boolean] as PropType<boolean | null>,
      default: null,
    },
    readOnly: {
      type: [null, Boolean] as PropType<boolean | null>,
      default: null,
    },
    required: {
      type: [null, Boolean] as PropType<boolean | null>,
      default: null,
    },
  },
  emits: ['focus', 'input', 'change'],
  computed: {
    doc(): Doc | undefined {
      // @ts-ignore
      const doc = this.injectedDoc;

      if (doc instanceof Doc) {
        return doc;
      }

      return undefined;
    },
    inputType(): string {
      return 'text';
    },
    labelClasses(): string {
      return 'text-gray-600 dark:text-gray-500 text-sm mb-1';
    },
    inputClasses(): string[] {
      /**
       * These classes will be used by components that extend Base
       */

      const classes: string[] = [];

      classes.push(...this.baseInputClasses);
      if (this.textRight ?? isNumeric(this.df)) {
        classes.push('text-end');
      }

      classes.push(this.sizeClasses);
      classes.push(this.inputReadOnlyClasses);

      return this.getInputClassesFromProp(classes).filter(Boolean);
    },
    baseInputClasses(): string[] {
      return [
        'text-base',
        'focus:outline-none',
        'w-full',
        'placeholder-gray-500',
      ];
    },
    sizeClasses(): string {
      if (this.size === 'small') {
        return 'px-2 py-1';
      }
      return 'px-3 py-2';
    },
    inputReadOnlyClasses(): string {
      if (this.isReadOnly) {
        return 'text-gray-800 dark:text-gray-300 cursor-default';
      }

      return 'text-gray-900 dark:text-gray-100';
    },
    containerClasses(): string[] {
      /**
       * Used to accomodate extending compoents where the input is contained in
       * a div eg AutoComplete
       */
      const classes: string[] = [];
      classes.push(...this.baseContainerClasses);
      classes.push(this.containerReadOnlyClasses);
      classes.push(this.borderClasses);
      return classes.filter(Boolean);
    },
    baseContainerClasses(): string[] {
      return ['rounded'];
    },
    containerReadOnlyClasses(): string {
      if (!this.isReadOnly) {
        return 'focus-within:bg-gray-100 dark:focus-within:bg-gray-850';
      }

      return '';
    },
    borderClasses(): string {
      if (!this.border) {
        return '';
      }

      const border = 'border border-gray-200 dark:border-gray-800';
      let background = 'bg-gray-25 dark:bg-gray-875';
      if (this.isReadOnly) {
        background = 'bg-gray-50 dark:bg-gray-850';
      }

      return border + ' ' + background;
    },
    inputPlaceholder(): string {
      return this.placeholder || this.df.placeholder || this.df.label;
    },
    showMandatory(): boolean {
      return this.isEmpty && this.isRequired;
    },
    isEmpty(): boolean {
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
    isReadOnly(): boolean {
      if (typeof this.readOnly === 'boolean') {
        return this.readOnly;
      }

      return evaluateReadOnly(this.df, this.doc);
    },
    isRequired(): boolean {
      if (typeof this.required === 'boolean') {
        return this.required;
      }

      return evaluateRequired(this.df, this.doc);
    },
  },
  methods: {
    onBlur(e: FocusEvent) {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (this.isReadOnly) {
        return;
      }

      this.triggerChange(target.value);
    },
    getInputClassesFromProp(classes: string[]) {
      if (!this.inputClass) {
        return classes;
      }

      let inputClass = this.inputClass;
      if (typeof inputClass === 'string') {
        inputClass = [inputClass];
      }

      inputClass = inputClass.filter((i) => typeof i === 'string');

      return [classes, inputClass].flat();
    },
    focus(): void {
      const el = this.$refs.input;

      if (el instanceof HTMLInputElement) {
        el.focus();
      }
    },
    triggerChange(value: unknown): void {
      value = this.parse(value);

      if (value === '') {
        value = null;
      }

      this.$emit('change', value);
    },
    parse(value: unknown): unknown {
      return value;
    },
    isNumeric,
  },
});
</script>
