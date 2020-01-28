<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <div
      class="relative flex items-center justify-end bg-white focus-within:bg-gray-200"
      :class="inputClasses"
    >
      <select
        class="appearance-none bg-transparent focus:outline-none w-full"
        :class="isReadOnly && 'pointer-events-none'"
        :value="value"
        @change="e => triggerChange(e.target.value)"
        @focus="e => $emit('focus', e)"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <div
        class="absolute left-0 pl-2 text-gray-400 pointer-events-none"
        v-if="!value"
      >
        {{ inputPlaceholder }}
      </div>
      <svg
        class="w-3 h-3 absolute"
        viewBox="0 0 5 10"
        xmlns="http://www.w3.org/2000/svg"
      >
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
