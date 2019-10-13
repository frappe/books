<template>
  <div>
    <select
      class="appearance-none bg-white"
      :class="inputClasses"
      :value="value"
      @blur="e => triggerChange(e.target.value)"
    >
      <option v-for="option in options" :value="option.value">{{ option.label }}</option>
    </select>
  </div>
</template>

<script>
import Base from './Base';

export default {
  name: 'Select',
  extends: Base,
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
