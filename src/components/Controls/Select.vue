<template>
  <div>
    <div v-if="showLabel" :class="labelClasses">
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
          custom-scroll custom-scroll-thumb2
        "
        :class="{
          'pointer-events-none': isReadOnly,
          'text-gray-500': !value,
        }"
        :value="value"
        @change="onChange"
        @focus="(e) => $emit('focus', e)"
      >
        <option
          v-if="inputPlaceholder && !showLabel"
          value=""
          disabled
          selected
          class="text-black dark:text-gray-200 dark:bg-gray-850"
        >
          {{ inputPlaceholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="text-black dark:text-gray-200 dark:bg-gray-850"
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
          :class="
            showMandatory
              ? 'text-red-400 dark:text-red-600'
              : 'text-gray-400 dark:text-gray-600'
          "
          fill="none"
          fill-rule="evenodd"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
import Base from './Base.vue';

import { defineComponent } from 'vue';
import { SelectOption } from 'schemas/types';
export default defineComponent({
  name: 'Select',
  extends: Base,
  emits: ['focus'],
  computed: {
    options(): SelectOption[] {
      if (this.df.fieldtype !== 'Select') {
        return [];
      }

      return this.df.options;
    },
  },
  methods: {
    onChange(e: Event) {
      const target = e.target;
      if (
        !(target instanceof HTMLSelectElement) &&
        !(target instanceof HTMLInputElement)
      ) {
        return;
      }

      this.triggerChange(target.value);
    },
  },
});
</script>
