<template>
  <Dropdown ref="dropdown" class="text-sm" :items="periodOptions" right>
    <template
      v-slot="{
        toggleDropdown,
        highlightItemUp,
        highlightItemDown,
        selectHighlightedItem
      }"
    >
      <div
        class="text-sm flex hover:bg-gray-100 focus:outline-none focus:bg-gray-100 items-center px-3 py-1 rounded-md leading-relaxed cursor-pointer"
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
  props: ['value'],
  components: {
    Dropdown
  },
  data() {
    let options = ['This Year', 'This Quarter', 'This Month'];
    return {
      periodOptions: options.map(option => {
        return {
          label: option,
          action: () => this.selectOption(option)
        };
      })
    };
  },
  methods: {
    selectOption(value) {
      this.$emit('change', value);
      this.$refs.dropdown.toggleDropdown(false);
    }
  }
};
</script>
