<template>
  <div>
    <input
      ref="input"
      :class="inputClasses"
      :type="inputType"
      :value="value"
      :placeholder="inputPlaceholder"
      :readonly="df.readOnly"
      @blur="e => triggerChange(e.target.value)"
    />
  </div>
</template>

<script>
export default {
  name: 'Base',
  props: ['df', 'value', 'inputClass', 'placeholder', 'size'],
  inject: ['doctype', 'name'],
  computed: {
    inputType() {
      return 'text';
    },
    inputClasses() {
      return [
        this.inputClass,
        {
          'px-3 py-2': this.size !== 'small',
          'px-2 py-1': this.size === 'small'
        },
        'focus:outline-none focus:bg-gray-200 rounded-5px w-full text-gray-900'
      ];
    },
    inputPlaceholder() {
      return this.placeholder || this.df.placeholder
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    triggerChange(value) {
      this.$emit('change', value);
    },
    isNumeric(df) {
      return ['Int', 'Float', 'Currency'].includes(df.fieldtype);
    }
  }
};
</script>
