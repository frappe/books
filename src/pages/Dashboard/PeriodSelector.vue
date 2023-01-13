<template>
  <Dropdown ref="dropdown" class="text-sm" :items="periodOptions" right>
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
          hover:text-gray-800
          focus:text-gray-800
          items-center
          py-1
          rounded-md
          leading-relaxed
          cursor-pointer
        "
        :class="!value ? 'text-gray-600' : 'text-gray-900'"
        @click="toggleDropdown()"
        tabindex="0"
        @keydown.down="highlightItemDown"
        @keydown.up="highlightItemUp"
        @keydown.enter="selectHighlightedItem"
      >
        {{ periodSelectorMap?.[value] ?? value }}
        <feather-icon name="chevron-down" class="ms-1 w-3 h-3" />
      </div>
    </template>
  </Dropdown>
</template>

<script>
import { t } from 'fyo';
import Dropdown from 'src/components/Dropdown.vue';

export default {
  name: 'PeriodSelector',
  props: {
    value: String,
    options: {
      type: Array,
      default: () => ['This Year', 'This Quarter', 'This Month'],
    },
  },
  emits: ['change'],
  components: {
    Dropdown,
  },
  mounted() {
    this.periodSelectorMap = {
      '': t`Set Period`,
      'This Year': t`This Year`,
      'This Quarter': t`This Quarter`,
      'This Month': t`This Month`,
    };

    this.periodOptions = this.options.map((option) => {
      let label = this.periodSelectorMap[option] ?? option;

      return {
        label,
        action: () => this.selectOption(option),
      };
    });
  },
  data() {
    return {
      periodSelectorMap: {},
      periodOptions: [],
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
