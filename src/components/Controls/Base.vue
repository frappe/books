<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <input
      ref="input"
      :class="inputClasses"
      :type="inputType"
      :value="value"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      @blur="e => triggerChange(e.target.value)"
      @focus="e => $emit('focus', e)"
      @input="e => $emit('input', e)"
    />
  </div>
</template>

<script>
export default {
  name: 'Base',
  props: [
    'df',
    'value',
    'inputClass',
    'placeholder',
    'size',
    'showLabel',
    'readOnly',
    'background'
  ],
  inject: {
    doctype: {
      default: null
    },
    name: {
      default: null
    },
    doc: {
      default: null
    }
  },
  computed: {
    inputType() {
      return 'text';
    },
    inputClasses() {
      return [
        this.inputClass,
        {
          'px-3 py-2': this.size !== 'small',
          'px-2 py-1': this.size === 'small',
          'bg-gray-100': this.background
        },
        'focus:outline-none focus:bg-gray-200 rounded w-full text-gray-900'
      ];
    },
    inputPlaceholder() {
      return this.placeholder || this.df.placeholder;
    },
    isReadOnly() {
      return this.readOnly || this.df.readOnly;
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
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
    isNumeric(df) {
      return ['Int', 'Float', 'Currency'].includes(df.fieldtype);
    }
  }
};
</script>
