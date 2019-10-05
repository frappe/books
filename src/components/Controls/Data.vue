<template>
  <div>
    <input
      ref="input"
      class="focus:outline-none w-full"
      :class="inputClass"
      type="text"
      :value="value"
      @blur="triggerChange"
    />
  </div>
</template>

<script>
export default {
  name: 'Data',
  props: ['df', 'value', 'inputClass'],
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    triggerChange(e) {
      this.$emit('change', e.target.value);
    }
  }
};
</script>
