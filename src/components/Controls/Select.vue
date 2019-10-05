<template>
  <div>
    <select
      class="appearance-none bg-white rounded-none focus:outline-none w-full"
      :class="inputClass"
      :value="value"
      @blur="triggerChange"
    >
      <option v-for="option in options" :value="option.value">{{ option.label }}</option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'Select',
  props: ['df', 'value', 'inputClass'],
  methods: {
    triggerChange(e) {
      this.$emit('change', e.target.value);
    }
  },
  computed: {
    options() {
      let options = this.df.options;
      return options.map(o => {
        if (typeof o === 'string') {
          return { label: o, value: o };
        }
        return o;
      });
    }
  }
};
</script>
