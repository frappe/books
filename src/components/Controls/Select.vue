<template>
  <div>
    <div :class="labelClasses" v-if="showLabel">
      {{ df.label }}
    </div>
    <div
      class="flex items-center justify-between"
      :class="[inputClasses, containerClasses]"
    >
      <select
        class="
          appearance-none
          bg-transparent
          focus:outline-none
          w-11/12
          cursor-pointer
        "
        :class="{
          'pointer-events-none': isReadOnly,
          'text-gray-500': !value,
        }"
        :value="value"
        @change="(e) => triggerChange(e.target.value)"
        @focus="(e) => $emit('focus', e)"
      >
        <option
          value=""
          disabled
          selected
          v-if="inputPlaceholder && !showLabel"
        >
          {{ inputPlaceholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="text-black"
        >
          {{ option.label }}
        </option>
      </select>
      <svg
        v-if="!isReadOnly"
        class="w-3 h-3"
        style="background: inherit; margin-right: -3px"
        viewBox="0 0 5 10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 2.636L2.636 1l1.637 1.636M1 7.364L2.636 9l1.637-1.636"
          class="stroke-current"
          :class="showMandatory ? 'text-red-400' : 'text-gray-400'"
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
  emits: ['focus'],
  methods: {
    map(v) {
      if (this.df.map) {
        return this.df.map[v] ?? v;
      }
      return v;
    },
  },
  computed: {
    options() {
      let options = this.df.options;
      return options.map((o) => {
        if (typeof o === 'string') {
          return { label: this.map(o), value: o };
        }
        return o;
      });
    },
  },
};
</script>
