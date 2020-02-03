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
    'autofocus'
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
          'pointer-events-none': this.isReadOnly
        },
        'focus:outline-none focus:bg-gray-200 rounded w-full text-gray-900 placeholder-gray-400'
      ];

      return this.getInputClassesFromProp(classes);
    },
    inputPlaceholder() {
      return this.placeholder || this.df.placeholder;
    },
    isReadOnly() {
      if (this.readOnly != null) {
        return this.readOnly;
      }
      return this.df.readOnly;
    }
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
    isNumeric(df) {
      return ['Int', 'Float', 'Currency'].includes(df.fieldtype);
    }
  }
};
</script>
