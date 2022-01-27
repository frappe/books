<template>
  <Dropdown ref="dropdown" class="text-sm z-10" :items="periodOptions" right>
    <template
      v-slot="{
        toggleDropdown,
        highlightItemUp,
        highlightItemDown,
        selectHighlightedItem,
      }"
    >
      <div
        class="
          text-sm
          flex
          focus:outline-none
          text-gray-900
          hover:text-gray-800
          focus:text-gray-800
          items-center
          py-1
          rounded-md
          leading-relaxed
          cursor-pointer
        "
        @click="toggleDropdown()"
        tabindex="0"
        @keydown.down="highlightItemDown"
        @keydown.up="highlightItemUp"
        @keydown.enter="selectHighlightedItem"
      >
        {{ value }}
        <feather-icon name="chevron-down" class="ml-1 w-3 h-3" />
      </div>
    </template>
  </Dropdown>
</template>

<script>
import Dropdown from '@/components/Dropdown';
export default {
  name: 'PeriodSelector',
  props: {
    value: String,
    options: {
      type: Array,
      default: () => ['This Year', 'This Quarter', 'This Month'],
    },
  },

  components: {
    Dropdown,
  },
  data() {
    return {
      periodOptions: this.options.map((option) => {
        return {
          label: option,
          action: () => this.selectOption(option),
        };
      }),
    };
  },
  methods: {
    selectOption(value) {
      this.$emit('change', value);
      this.$refs.dropdown.toggleDropdown(false);
    },
  },
};
</script>
