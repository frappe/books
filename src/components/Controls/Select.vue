<template>
  <div class="relative flex items-center justify-end bg-white focus-within:bg-gray-200" :class="inputClasses">
    <select
      class="appearance-none bg-transparent focus:outline-none w-full"
      :value="value"
      @blur="e => triggerChange(e.target.value)"
    >
      <option v-for="option in options" :value="option.value">{{ option.label }}</option>
    </select>
    <svg class="w-3 h-3 absolute" viewBox="0 0 5 10" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 2.636L2.636 1l1.637 1.636M1 7.364L2.636 9l1.637-1.636"
        stroke="#404040"
        fill="none"
        fill-rule="evenodd"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
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
