<template>
  <div>
    <div v-if="showLabel" :class="labelClasses">
      {{ df.label }}
    </div>
    <div
      v-on-outside-click="() => (dropdownVisible = false)"
      class="flex items-center justify-between"
      :class="[
        inputClasses,
        containerClasses,
        dropdownVisible ? 'dark:hover:bg-gray-850' : '',
      ]"
    >
      <div class="relative w-full" @click="toggleDropdown">
        <div
          class="
            flex
            items-center
            justify-between
            bg-transparent
            w-full
            cursor-pointer
            custom-scroll custom-scroll-thumb2
          "
          :class="{
            'pointer-events-none': isReadOnly,
            'text-gray-500': !value,
          }"
        >
          <span v-if="value" class="cursor-text w-full">{{ value }}</span>
          <span v-else>{{ inputPlaceholder }}</span>
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
        <div
          v-if="dropdownVisible"
          class="
            absolute
            z-10
            mt-4
            w-full
            bg-white
            dark:bg-gray-850
            border border-gray-300
            dark:border-gray-700
            cursor-pointer
            rounded-md
            shadow-lg
          "
        >
          <ul
            class="
              max-h-40
              p-1
              overflow-auto
              custom-scroll custom-scroll-thumb1
            "
          >
            <li
              v-for="option in options"
              :key="option.value"
              @click="selectOption(option)"
              class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-875"
            >
              {{ option.label }}
            </li>
          </ul>
        </div>
      </div>
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
  data() {
    return {
      dropdownVisible: false,
    };
  },
  computed: {
    options(): SelectOption[] {
      if (this.df.fieldtype !== 'Select') {
        return [];
      }

      return this.df.options;
    },
  },
  methods: {
    toggleDropdown() {
      if (!this.isReadOnly) {
        this.dropdownVisible = !this.dropdownVisible;
      }
    },
    selectOption(option: SelectOption) {
      this.dropdownVisible = false;
      this.triggerChange(option.value);
      this.dropdownVisible = !this.dropdownVisible;
    },
  },
});
</script>
