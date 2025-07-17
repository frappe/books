<template>
  <div>
    <div v-if="showLabel" :class="labelClasses">
      {{ df.label }}
    </div>
    <div
      v-on-outside-click="() => (dropdownVisible = false)"
      class="relative flex items-center justify-between"
      :class="[
        inputClasses,
        containerClasses,
        dropdownVisible ? 'dark:hover:bg-gray-850' : '',
      ]"
    >
      <div class="w-full" @click="toggleDropdown">
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
          <span
            v-if="selectValue || value"
            class="cursor-text text-black dark:text-white w-full"
            >{{ selectValue ? selectValue : value }}</span
          >
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
            w-60
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
              class="
                p-1.5
                rounded-md
                hover:bg-gray-100
                dark:hover:bg-gray-875
                flex
              "
              :class="selectValue !== option.label ? 'pl-6' : 'pl-2'"
            >
              <svg
                v-if="selectValue === option.label"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="13"
                height="20"
                viewBox="0 0 50 50"
                fill="currentColor"
                class="mr-1"
              >
                <path
                  d="M 41.9375 8.625 C 41.273438 8.648438 40.664063 9 40.3125 9.5625 L 21.5 38.34375 L 9.3125 27.8125 C 8.789063 27.269531 8.003906 27.066406 7.28125 27.292969 C 6.5625 27.515625 6.027344 28.125 5.902344 28.867188 C 5.777344 29.613281 6.078125 30.363281 6.6875 30.8125 L 20.625 42.875 C 21.0625 43.246094 21.640625 43.410156 22.207031 43.328125 C 22.777344 43.242188 23.28125 42.917969 23.59375 42.4375 L 43.6875 11.75 C 44.117188 11.121094 44.152344 10.308594 43.78125 9.644531 C 43.410156 8.984375 42.695313 8.589844 41.9375 8.625 Z"
                ></path>
              </svg>
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
      selectValue: this.value,
    };
  },
  props: {
    closeDropDown: {
      type: Boolean,
      default: true,
    },
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
      if (!this.closeDropDown) {
        this.dropdownVisible = true;
      } else if (!this.isReadOnly) {
        this.dropdownVisible = !this.dropdownVisible;
      }
    },
    selectOption(option: SelectOption) {
      this.selectValue = option.label;
      this.triggerChange(option.value);

      if (this.closeDropDown) {
        this.dropdownVisible = !this.dropdownVisible;
      }
    },
  },
});
</script>
