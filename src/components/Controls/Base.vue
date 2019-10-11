<template>
  <div>
    <input
      ref="input"
      class="focus:outline-none w-full"
      :class="inputClass"
      :type="inputType"
      :value="value"
      :placeholder="placeholder"
      :readonly="df.readOnly"
      @blur="e => triggerChange(e.target.value)"
    />
  </div>
</template>

<script>
export default {
  name: 'Base',
  props: ['df', 'value', 'inputClass', 'placeholder'],
  inject: ['doctype', 'name'],
  computed: {
    inputType() {
      return 'text'
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    triggerChange(value) {
      this.$emit('change', value);
    }
  }
};
</script>
